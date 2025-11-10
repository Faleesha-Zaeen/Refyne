
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const unzipper = require('unzipper');

const { scanProject } = require('./utils/fileScanner');
const { analyzeProject } = require('./utils/analyzer');
const { getGeminiModel, getModelCandidates } = require('./utils/geminiClient');

dotenv.config();

const PORT = process.env.PORT || 5000;
const UPLOAD_ROOT = path.join(__dirname, 'uploads', 'tmp');
const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');

const app = express();
app.locals.projects = {}; // in-memory map projectId -> { path, scan }

// allow larger JSON payloads (used by analyze/refactor endpoints)
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Ensure required folders exist
const ensureDir = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
};
ensureDir(UPLOAD_ROOT);
ensureDir(DATA_DIR);

// History helpers
const loadHistory = async () => {
  try {
    if (!fs.existsSync(HISTORY_PATH)) {
      await fsp.writeFile(HISTORY_PATH, '[]', 'utf8');
      return [];
    }
    const raw = await fsp.readFile(HISTORY_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('[Refyne] loadHistory failed:', err);
    return [];
  }
};

const saveHistory = async (entries) => {
  try {
    await fsp.writeFile(HISTORY_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch (err) {
    console.error('[Refyne] saveHistory failed:', err);
  }
};

// Multer disk storage (200MB)
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ROOT),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// Utility: extract ZIP stream -> folder
const extractZipTo = async (zipPath, destDir) => {
  await ensureDir(destDir);
  await new Promise((resolve, reject) => {
    const rs = fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: destDir }))
      .on('close', resolve)
      .on('error', reject);
    // Note: pipe returns the destination stream; we attach events on it above
  });
};

// Upload route: accepts single field 'project' (zip file), extracts into uploads/tmp/<projectId>
app.post('/api/upload', upload.single('project'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No project archive received.' });
  }

  const projectId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const extractDir = path.join(UPLOAD_ROOT, projectId);
  ensureDir(extractDir);

  try {
    // small delay to allow filesystem flush (usually not required, safe)
    await new Promise(resolve => setTimeout(resolve, 50));

    // Extract streamed zip using unzipper (handles large zips well)
    await extractZipTo(req.file.path, extractDir);

    // scanProject should walk the extracted folder and return structure
    const scan = await scanProject(extractDir);

    // store in-memory quick lookup for later analyze / refactor calls
    app.locals.projects[projectId] = { path: extractDir, scan };

    console.log(`[Refyne] Uploaded and extracted project ${projectId} -> ${extractDir}`);
    return res.status(200).json({ projectId, root: extractDir, scan });
  } catch (err) {
    console.error('[Refyne] Upload error:', err);
    return res.status(500).json({ error: 'Failed to process archive.' });
  }
});

// Analyze route: expects { projectId } in body
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

    // update in-memory snapshot
    app.locals.projects[projectId].scan = freshScan;

    return res.status(200).json({ projectId, scan: freshScan, analysis });
  } catch (err) {
    console.error('[Refyne] Analyze error:', err);
    return res.status(500).json({ error: 'Failed to analyze project.' });
  }
});

// Refactor route: uses Gemini flash-preferring candidate list to request refactor guidance
app.post('/api/refactor', async (_req, res) => {
  try {
    const historyEntries = await loadHistory();
    if (!historyEntries.length) {
      return res.status(400).json({
        success: false,
        error: 'No analysis history found. Run an analysis before requesting refactor guidance.'
      });
    }

    // Use the most recent snapshot for refactor prompt
    const lastSnapshot = historyEntries[0];

    // Build the refactor prompt (you can customize further)
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

    // pick model candidates and prefer any with "flash" in the name
    const candidates = await getModelCandidates();
    if (candidates && candidates.length) {
      console.log('[Refyne] Gemini candidates:', candidates.join(', '));
    } else {
      console.warn('[Refyne] No Gemini candidates resolved; check GEMINI_API_KEY.');
    }

    // reorder candidates to prefer flash-like models
    const ordered = (candidates || []).slice().sort((a, b) => {
      const score = (name) => (/(flash|flash-lite|flash-latest)/i.test(name) ? 0 : 1);
      return score(a) - score(b);
    });

    let aiPayload = null;
    let lastGeminiError = null;

    for (const candidate of ordered) {
      try {
        const model = getGeminiModel(candidate);
        if (!model) continue;

        console.log(`[Refyne] Requesting Gemini refactor via model: ${candidate}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const rawText = typeof response?.text === 'function' ? await response.text() : response?.text ?? '';

        try {
          aiPayload = JSON.parse(rawText);
        } catch (parseErr) {
          // try to extract embedded JSON block
          const embeddedJson = (typeof rawText === 'string') ? (function tryExtract() {
            try { return JSON.parse(rawText); } catch (e) {}
            // fallback: find first {...} or [...]
            const find = (s) => {
              const m = s.match(/({[\s\S]*}|\[[\s\S]*\])/);
              return m ? m[0] : null;
            };
            const frag = find(rawText);
            if (frag) {
              try { return JSON.parse(frag); } catch (e) {}
            }
            return null;
          })() : null;

          if (embeddedJson) {
            aiPayload = embeddedJson;
          } else {
            // fallback: sanitize plaintext into a summary object
            aiPayload = {
              summary: (typeof rawText === 'string') ? rawText.replace(/```[\s\S]*?```/g, '').trim() : 'Empty response',
              issues: [],
              suggestions: [],
              refactoredFiles: []
            };
          }
        }

        // stop after first successful candidate
        break;
      } catch (gemErr) {
        lastGeminiError = gemErr;
        console.error(`[Refyne] Gemini request failed for model ${candidate}:`, gemErr?.message || gemErr);
      }
    }

    if (!aiPayload) {
      if (lastGeminiError) {
        return res.status(502).json({
          success: false,
          error: 'Failed to fetch refactor guidance from Gemini. Check model availability and API key.',
          details: lastGeminiError?.message || String(lastGeminiError)
        });
      }
      return res.status(503).json({
        success: false,
        error: 'Gemini integration is not configured or no models available. Set GEMINI_API_KEY.'
      });
    }

    // normalize aiPayload shape
    aiPayload = {
      summary: typeof aiPayload?.summary === 'string' ? aiPayload.summary : String(aiPayload?.summary || ''),
      issues: Array.isArray(aiPayload?.issues) ? aiPayload.issues : [],
      suggestions: Array.isArray(aiPayload?.suggestions) ? aiPayload.suggestions : [],
      refactoredFiles: Array.isArray(aiPayload?.refactoredFiles) ? aiPayload.refactoredFiles : []
    };

    // persist to history
    const entry = {
      timestamp: Date.now(),
      type: 'gemini-refactor',
      ...aiPayload
    };
    const prev = await loadHistory();
    const updated = [entry, ...prev].slice(0, 25);
    await saveHistory(updated);

    console.log('[Refyne] Gemini refactor guidance stored.');
    return res.status(200).json({ success: true, data: aiPayload });
  } catch (err) {
    console.error('[Refyne] Refactor route error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// History endpoint
app.get('/api/history', async (_req, res) => {
  try {
    const historyEntries = await loadHistory();
    return res.status(200).json({ history: historyEntries });
  } catch (err) {
    console.error('[Refyne] History error:', err);
    return res.status(500).json({ error: 'Failed to read history.' });
  }
});

app.listen(PORT, () => {
  console.log(`[Refyne] Server running on port ${PORT}`);
});
