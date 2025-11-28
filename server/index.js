
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

// Recommendations route: AI-powered code improvement suggestions
app.post('/api/recommendations', async (req, res) => {
  const { analysis } = req.body;

  if (!analysis) {
    return res.status(400).json({
      success: false,
      error: 'No analysis data provided. Run an analysis first.'
    });
  }

  try {
    // Build the AI prompt for recommendations
    const prompt = `You are an expert software architect and senior developer. 
Analyze this codebase analysis and provide specific, actionable recommendations:

PROJECT ANALYSIS DATA:
${JSON.stringify(analysis, null, 2)}

Provide recommendations in this exact JSON format:
{
  "recommendations": [
    {
      "category": "Performance|Architecture|Security|Maintainability|Code Quality|Testing|Documentation",
      "title": "Specific, actionable recommendation title",
      "description": "Detailed explanation of the issue, why it matters, and specific steps to fix it",
      "priority": "high|medium|low",
      "effort": "low|medium|high", 
      "impact": "low|medium|high",
      "files": ["array of affected files or directories"],
      "estimatedTime": "realistic time estimate like '2-4 hours' or '1-2 days'",
      "confidence": 0.85,
      "aiExplanation": "Technical reasoning why this recommendation was generated based on the analysis data"
    }
  ],
  "summary": {
    "totalRecommendations": 6,
    "highPriority": 2,
    "estimatedTotalEffort": "8-16 hours",
    "potentialImpact": "Specific impact description like '40% performance improvement possible'"
  }
}

Focus on these areas based on the analysis data:
1. Performance bottlenecks (high complexity, large files, etc.)
2. Architectural issues (poor modularity, dependency problems)
3. Security vulnerabilities 
4. Code quality issues (duplication, complexity, maintainability)
5. Testing gaps
6. Documentation needs

Be specific and actionable. Reference actual metrics from the analysis like architectureScore, modularityScore, fileCount, etc.`;

    // Use Gemini models for recommendations
    const candidates = await getModelCandidates();
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

        console.log(`[Refyne] Requesting recommendations via model: ${candidate}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const rawText = typeof response?.text === 'function' ? await response.text() : response?.text ?? '';

        try {
          aiPayload = JSON.parse(rawText);
        } catch (parseErr) {
          // Try to extract JSON from response
          const embeddedJson = (function tryExtract() {
            try { 
              return JSON.parse(rawText); 
            } catch (e) {}
            
            // Look for JSON blocks in markdown
            const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              try {
                return JSON.parse(jsonMatch[1]);
              } catch (e) {}
            }
            
            // Find first {...} block
            const braceMatch = rawText.match(/({[\s\S]*})/);
            if (braceMatch) {
              try {
                return JSON.parse(braceMatch[1]);
              } catch (e) {}
            }
            
            return null;
          })();

          if (embeddedJson) {
            aiPayload = embeddedJson;
          } else {
            // Fallback: create basic recommendations from analysis
            aiPayload = generateFallbackRecommendations(analysis);
          }
        }

        break; // Success with this candidate
      } catch (gemErr) {
        lastGeminiError = gemErr;
        console.error(`[Refyne] Gemini recommendations failed for ${candidate}:`, gemErr?.message || gemErr);
      }
    }

    // If all Gemini attempts failed, use fallback
    if (!aiPayload) {
      console.log('[Refyne] Using fallback recommendations');
      aiPayload = generateFallbackRecommendations(analysis);
    }

    // Normalize and validate the response
    aiPayload = normalizeRecommendations(aiPayload, analysis);

    console.log(`[Refyne] Generated ${aiPayload.recommendations.length} recommendations`);
    return res.status(200).json({ 
      success: true, 
      data: aiPayload 
    });

  } catch (err) {
    console.error('[Refyne] Recommendations route error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate recommendations',
      details: err.message 
    });
  }
});

// Fallback recommendation generator based on analysis data
function generateFallbackRecommendations(analysis) {
  const { stats, summary } = analysis;
  const recommendations = [];
  
  // Performance recommendations
  if (stats.averageFunctionsPerFile > 8) {
    recommendations.push({
      category: 'Code Quality',
      title: 'Reduce Functions per File',
      description: `Your code has an average of ${stats.averageFunctionsPerFile} functions per file (ideal is 3-8). Large files are harder to maintain and test. Break them into smaller, focused modules with single responsibilities.`,
      priority: stats.averageFunctionsPerFile > 12 ? 'high' : 'medium',
      effort: 'medium',
      impact: 'high',
      files: ['Files with high function count'],
      estimatedTime: '3-6 hours',
      confidence: 0.85,
      aiExplanation: `High function count (${stats.averageFunctionsPerFile} avg) indicates files are doing too much. This reduces maintainability and testability.`
    });
  }

  if (stats.dependencyCount > 50) {
    recommendations.push({
      category: 'Architecture',
      title: 'Review External Dependencies',
      description: `Project has ${stats.dependencyCount} dependencies. High dependency count increases bundle size, security risks, and maintenance burden. Review if all dependencies are necessary and consider alternatives for large ones.`,
      priority: stats.dependencyCount > 100 ? 'high' : 'medium',
      effort: 'high',
      impact: 'medium',
      files: ['package.json', 'Various import statements'],
      estimatedTime: '1-2 days',
      confidence: 0.75,
      aiExplanation: `High dependency count (${stats.dependencyCount}) increases project complexity and security surface area.`
    });
  }

  if (stats.architectureScore < 70) {
    recommendations.push({
      category: 'Architecture',
      title: 'Improve Architecture Structure',
      description: `Current architecture score is ${stats.architectureScore}/100. Focus on better separation of concerns, modular design, and clear boundaries between components.`,
      priority: stats.architectureScore < 50 ? 'high' : 'medium',
      effort: 'high',
      impact: 'high',
      files: ['Project structure', 'Module organization'],
      estimatedTime: '2-4 days',
      confidence: 0.9,
      aiExplanation: `Low architecture score (${stats.architectureScore}) indicates structural issues that affect maintainability and scalability.`
    });
  }

  if (stats.totalLines > 10000) {
    recommendations.push({
      category: 'Performance',
      title: 'Implement Code Splitting',
      description: `Large codebase (${stats.totalLines} lines). Implement route-based code splitting to improve initial load time and user experience.`,
      priority: 'medium',
      effort: 'medium',
      impact: 'high',
      files: ['src/App.jsx', 'Routing configuration'],
      estimatedTime: '4-8 hours',
      confidence: 0.8,
      aiExplanation: `Large codebase (${stats.totalLines} lines) benefits significantly from code splitting for better performance.`
    });
  }

  if (stats.modularityScore < 70) {
    recommendations.push({
      category: 'Architecture',
      title: 'Improve Modularity',
      description: `Modularity score is ${stats.modularityScore}/100. Improve module boundaries and reduce coupling between components for better maintainability.`,
      priority: 'medium',
      effort: 'high',
      impact: 'high',
      files: ['Module boundaries', 'Component dependencies'],
      estimatedTime: '1-3 days',
      confidence: 0.85,
      aiExplanation: `Low modularity score (${stats.modularityScore}) indicates tight coupling between components.`
    });
  }

  // Add essential best practices
  recommendations.push(
    {
      category: 'Security',
      title: 'Add Input Validation',
      description: 'Implement comprehensive input validation across all API endpoints to prevent injection attacks and data corruption.',
      priority: 'high',
      effort: 'low',
      impact: 'high',
      files: ['API endpoints', 'Middleware', 'Input handlers'],
      estimatedTime: '2-4 hours',
      confidence: 0.95,
      aiExplanation: 'Input validation is a fundamental security practice for all web applications.'
    },
    {
      category: 'Maintainability',
      title: 'Add Error Boundaries',
      description: 'Implement React error boundaries to prevent entire app crashes from component errors and provide better user experience.',
      priority: 'medium',
      effort: 'low',
      impact: 'medium',
      files: ['src/components/ErrorBoundary.jsx', 'src/App.jsx'],
      estimatedTime: '1-2 hours',
      confidence: 0.8,
      aiExplanation: 'Error boundaries improve application resilience and user experience.'
    },
    {
      category: 'Code Quality',
      title: 'Add Automated Testing',
      description: 'Implement comprehensive test coverage including unit tests, integration tests, and end-to-end tests.',
      priority: 'medium',
      effort: 'high',
      impact: 'high',
      files: ['Test setup', 'Component tests', 'API tests'],
      estimatedTime: '2-5 days',
      confidence: 0.9,
      aiExplanation: 'Automated testing is essential for code quality and preventing regressions.'
    }
  );

  return {
    recommendations: recommendations.slice(0, 8), // Limit to 8 most relevant
    summary: {
      totalRecommendations: recommendations.length,
      highPriority: recommendations.filter(r => r.priority === 'high').length,
      estimatedTotalEffort: calculateTotalEffort(recommendations),
      potentialImpact: 'Significant improvements in maintainability, performance, and code quality'
    }
  };
}

// Helper function to calculate total effort
function calculateTotalEffort(recommendations) {
  const effortMap = { low: 2, medium: 8, high: 24 }; // hours
  const totalHours = recommendations.reduce((sum, rec) => {
    return sum + (effortMap[rec.effort] || 4);
  }, 0);
  
  if (totalHours <= 8) return `${totalHours} hours`;
  if (totalHours <= 40) return `${Math.ceil(totalHours / 8)} days`;
  return `${Math.ceil(totalHours / 40)} weeks`;
}

// Normalize and validate recommendations
function normalizeRecommendations(aiPayload, analysis) {
  let recommendations = Array.isArray(aiPayload.recommendations) ? aiPayload.recommendations : [];
  let summary = aiPayload.summary || {};
  
  // Ensure all recommendations have required fields
  recommendations = recommendations.map(rec => ({
    category: rec.category || 'Code Quality',
    title: rec.title || 'Improvement Suggestion',
    description: rec.description || 'General code improvement',
    priority: ['high', 'medium', 'low'].includes(rec.priority) ? rec.priority : 'medium',
    effort: ['low', 'medium', 'high'].includes(rec.effort) ? rec.effort : 'medium',
    impact: ['low', 'medium', 'high'].includes(rec.impact) ? rec.impact : 'medium',
    files: Array.isArray(rec.files) ? rec.files : ['Various files'],
    estimatedTime: rec.estimatedTime || '2-4 hours',
    confidence: typeof rec.confidence === 'number' ? Math.min(Math.max(rec.confidence, 0), 1) : 0.7,
    aiExplanation: rec.aiExplanation || 'AI-generated recommendation based on code analysis'
  }));

  // Ensure summary has required fields
  summary = {
    totalRecommendations: recommendations.length,
    highPriority: recommendations.filter(r => r.priority === 'high').length,
    estimatedTotalEffort: summary.estimatedTotalEffort || calculateTotalEffort(recommendations),
    potentialImpact: summary.potentialImpact || 'Based on code analysis metrics'
  };

  return { recommendations, summary };
}

// Optional: Add route to apply specific recommendations
app.post('/api/apply-recommendation', async (req, res) => {
  const { recommendation, analysis } = req.body;
  
  if (!recommendation || !analysis) {
    return res.status(400).json({
      success: false,
      error: 'Missing recommendation or analysis data'
    });
  }

  try {
    // This would implement the actual code transformation
    // For now, return a mock response
    const result = {
      success: true,
      message: `Recommendation "${recommendation.title}" applied successfully`,
      changes: [
        {
          file: recommendation.files[0] || 'example.js',
          changes: 'Code modifications applied',
          diff: 'Mock diff output'
        }
      ]
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Refyne] Apply recommendation error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply recommendation'
    });
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
