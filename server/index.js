const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const AdmZip = require('adm-zip');

const { scanProject } = require('./utils/fileScanner');
const { analyzeProject } = require('./utils/analyzer');
const { getGeminiModel, getModelCandidates } = require('./utils/geminiClient');

dotenv.config();

const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
console.log(`[Refyne] GEMINI_API_KEY ${hasGeminiKey ? '✅ loaded' : '❌ missing'}`);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const UPLOAD_ROOT = path.join(__dirname, 'uploads', 'tmp');
const HISTORY_PATH = path.join(__dirname, '..', 'data', 'history.json');

const ensureDir = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
};

ensureDir(UPLOAD_ROOT);

const extractJsonFragment = (payload) => {
  if (typeof payload !== 'string') {
    return null;
  }

  const searchTargets = ['{', '['];
  for (const opening of searchTargets) {
    const closing = opening === '{' ? '}' : ']';
    const startIndex = payload.indexOf(opening);
    if (startIndex === -1) {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = startIndex; index < payload.length; index += 1) {
      const char = payload[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === opening) {
        depth += 1;
      } else if (char === closing) {
        depth -= 1;
        if (depth === 0) {
          return payload.slice(startIndex, index + 1);
        }
      }
    }
  }

  return null;
};

const sanitizeGeminiPlaintext = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/```/g, '')
    .replace(/^[a-z]+\n/gim, '')
    .trim();
};

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage, limits: { fileSize: 50 * 1024 * 1024 } });

app.locals.projects = Object.create(null);

const loadHistory = async () => {
  try {
    const payload = await fsp.readFile(HISTORY_PATH, 'utf8');
    return JSON.parse(payload);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fsp.writeFile(HISTORY_PATH, '[]', 'utf8');
      return [];
    }
    throw err;
  }
};

const saveHistory = async (entries) => {
  await fsp.writeFile(HISTORY_PATH, JSON.stringify(entries, null, 2), 'utf8');
};

app.post('/api/upload', upload.single('project'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No project archive received.' });
  }

  const projectId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const extractDir = path.join(UPLOAD_ROOT, projectId);

  try {
    ensureDir(extractDir);

    const zip = new AdmZip(req.file.buffer);
    zip.extractAllTo(extractDir, true);

    const scan = await scanProject(extractDir);
    app.locals.projects[projectId] = { path: extractDir, scan };

    res.status(200).json({ projectId, root: extractDir, scan });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process archive.' });
  }
});

app.post('/api/analyze', async (req, res) => {
  const { projectId } = req.body || {};

  if (!projectId || !app.locals.projects[projectId]) {
    return res.status(400).json({ error: 'Unknown project. Upload a project before analyzing.' });
  }

  try {
    const target = app.locals.projects[projectId];
    const freshScan = await scanProject(target.path);
    const analysis = analyzeProject(freshScan);

    const historyEntries = await loadHistory();
    historyEntries.unshift({
      id: projectId,
      analyzedAt: new Date().toISOString(),
      summary: analysis.summary,
      stats: analysis.stats
    });
    await saveHistory(historyEntries.slice(0, 25));

    app.locals.projects[projectId].scan = freshScan;

    res.status(200).json({ projectId, scan: freshScan, analysis });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze project.' });
  }
});

app.post('/api/refactor', async (_req, res) => {
  try {
    const historyEntries = await loadHistory();
    if (!historyEntries.length) {
      return res.status(400).json({
        success: false,
        error: 'No analysis history found. Run an analysis before requesting refactor guidance.'
      });
    }

    const lastSnapshot = historyEntries[0] || historyEntries[historyEntries.length - 1];
    const prompt = `You are an experienced software architect.
Analyze the following project metrics and structure:
${JSON.stringify(lastSnapshot, null, 2)}

Identify weaknesses (e.g., poor modularization, duplicate code, lack of documentation).
Suggest improvements in architecture and design.
Show 1–2 example refactors (as full file code blocks).
Return your response strictly as a JSON object:
{
  "summary": "...",
  "issues": ["..."],
  "suggestions": ["..."],
  "refactoredFiles": [
    { "filename": "...", "before": "...", "after": "..." }
  ]
}`;

    let aiPayload = null;
    let lastGeminiError = null;
  const candidates = await getModelCandidates();
  if (candidates.length) {
    console.log('[Refyne] Gemini model candidates:', candidates.join(', '));
  } else {
    console.warn('[Refyne] No Gemini model candidates resolved. Check GEMINI_API_KEY permissions.');
  }

    for (const candidate of candidates) {
      try {
        const model = getGeminiModel(candidate);
        if (!model) {
          continue;
        }

        console.log(`[Refyne] Requesting Gemini refactor via model: ${candidate}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const rawText = typeof response?.text === 'function' ? await response.text() : response?.text ?? '';

        try {
          aiPayload = JSON.parse(rawText);
        } catch (parseErr) {
          const embeddedJson = extractJsonFragment(rawText);
          if (embeddedJson) {
            try {
              aiPayload = JSON.parse(embeddedJson);
            } catch (embeddedErr) {
              console.warn('[Refyne] Failed to parse embedded Gemini JSON fragment:', embeddedErr);
            }
          }

          if (!aiPayload) {
            console.warn('[Refyne] Gemini response was not valid JSON. Falling back to plaintext rendering.', parseErr);
            aiPayload = {
              summary: sanitizeGeminiPlaintext(rawText) || 'Gemini returned an empty response.',
              issues: [],
              suggestions: [],
              refactoredFiles: []
            };
          }
        }

        break;
      } catch (gemErr) {
        lastGeminiError = gemErr;
        console.error(`[Refyne] Gemini request failed for model ${candidate}:`, gemErr.message || gemErr);
      }
    }

    if (!aiPayload) {
      if (lastGeminiError) {
        return res.status(502).json({
          success: false,
          error: 'Failed to fetch refactor guidance from Gemini. Check model availability and API key.',
          details: lastGeminiError.message || String(lastGeminiError)
        });
      }

      console.warn('[Refyne] Gemini model unavailable. Check GEMINI_API_KEY configuration.');
      return res.status(503).json({
        success: false,
        error: 'Gemini integration is not configured. Set GEMINI_API_KEY to enable suggestions.'
      });
    }

    aiPayload = {
      summary: typeof aiPayload?.summary === 'string'
        ? aiPayload.summary
        : (aiPayload?.summary ?? '').toString(),
      issues: Array.isArray(aiPayload?.issues) ? aiPayload.issues : [],
      suggestions: Array.isArray(aiPayload?.suggestions) ? aiPayload.suggestions : [],
      refactoredFiles: Array.isArray(aiPayload?.refactoredFiles) ? aiPayload.refactoredFiles : []
    };

    const entry = {
      timestamp: Date.now(),
      type: 'gemini-refactor',
      ...aiPayload
    };

    const updatedHistory = [entry, ...historyEntries].slice(0, 25);
    await saveHistory(updatedHistory);

    console.log('[Refyne] Gemini refactor guidance stored.');
    return res.status(200).json({ success: true, data: aiPayload });
  } catch (err) {
    console.error('[Refyne] Refactor route error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

app.get('/api/history', async (_req, res) => {
  try {
    const historyEntries = await loadHistory();
    res.status(200).json({ history: historyEntries });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to read history.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Refyne 2.0 server running on port ${PORT}`);
});
