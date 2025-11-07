const { GoogleGenerativeAI } = require('@google/generative-ai');

let cachedClient = null;
let cachedKey = null;
let cachedInventory = null;
let cachedInventoryTimestamp = 0;

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const MODELS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const normalizeModelName = (value) => {
  if (!value) {
    return '';
  }
  return value.replace(/^models\//, '').trim();
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenerativeAI(apiKey);
    cachedKey = apiKey;
  }

  return cachedClient;
};

const DEFAULT_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest'
];

const fetchAvailableModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof fetch !== 'function') {
    return [];
  }

  const now = Date.now();
  if (cachedInventory && now - cachedInventoryTimestamp < MODEL_CACHE_TTL_MS) {
    return cachedInventory;
  }

  try {
    const response = await fetch(`${MODELS_ENDPOINT}?key=${apiKey}`);
    if (!response.ok) {
      console.warn(`[Refyne] Failed to list Gemini models (status ${response.status}).`);
      return [];
    }

    const payload = await response.json();
    const entries = Array.isArray(payload?.models) ? payload.models : [];
    const names = entries
      .map((entry) => normalizeModelName(entry?.name))
      .filter(Boolean);

    cachedInventory = names;
    cachedInventoryTimestamp = now;
    return names;
  } catch (err) {
    console.warn('[Refyne] Error listing Gemini models:', err?.message || err);
    return [];
  }
};

const getModelCandidates = async (preferredModel) => {
  const seen = new Set();
  const prioritized = [];
  const pushCandidate = (candidate) => {
    const normalized = normalizeModelName(candidate);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    prioritized.push(normalized);
  };

  const availableModels = await fetchAvailableModels();
  const availableSet = new Set(availableModels);
  const requestedOrder = [preferredModel, process.env.GEMINI_MODEL, ...DEFAULT_MODELS].filter(Boolean);

  if (availableSet.size > 0) {
    requestedOrder.forEach((model) => {
      if (availableSet.has(normalizeModelName(model))) {
        pushCandidate(model);
      }
    });

    requestedOrder.forEach((model) => {
      if (!availableSet.has(normalizeModelName(model))) {
        pushCandidate(model);
      }
    });

    availableModels.forEach(pushCandidate);
  } else {
    requestedOrder.forEach(pushCandidate);
  }

  return prioritized;
};

const getGeminiModel = (modelName) => {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }
  const resolved = modelName || process.env.GEMINI_MODEL || DEFAULT_MODELS[0];
  return client.getGenerativeModel({ model: resolved });
};

module.exports = { getGeminiClient, getGeminiModel, getModelCandidates };
