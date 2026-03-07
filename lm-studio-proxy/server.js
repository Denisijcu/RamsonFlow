const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Model Registry ───────────────────────────────────────────────────────────
const SUPPORTED_MODELS = [
  { id: 'google/gemma-3-4b',        name: 'Gemma 3 4B (Google)',      size: '2.5GB', speed: 'fast',   recommended: true  },
  { id: 'google/gemma-3-12b',       name: 'Gemma 3 12B (Google)',     size: '7.8GB', speed: 'medium', recommended: false },
  { id: 'qwen2.5-7b-instruct',      name: 'Qwen 2.5 7B Instruct',    size: '4.7GB', speed: 'fast',   recommended: false },
  { id: 'qwen2.5-14b-instruct',     name: 'Qwen 2.5 14B Instruct',   size: '9.0GB', speed: 'medium', recommended: false },
  { id: 'llama-3.2-3b-instruct',    name: 'LLaMA 3.2 3B Instruct',   size: '2.0GB', speed: 'fast',   recommended: false },
  { id: 'llama-3.1-8b-instruct',    name: 'LLaMA 3.1 8B Instruct',   size: '4.9GB', speed: 'medium', recommended: false },
  { id: 'mistral-7b-instruct-v0.3', name: 'Mistral 7B Instruct v0.3',size: '4.1GB', speed: 'fast',   recommended: false },
  { id: 'phi-3.5-mini-instruct',    name: 'Phi 3.5 Mini Instruct',   size: '2.2GB', speed: 'fast',   recommended: false },
  { id: 'deepseek-r1-7b',           name: 'DeepSeek R1 7B',          size: '4.7GB', speed: 'medium', recommended: false },
];

// ─── In-memory settings ───────────────────────────────────────────────────────
let settings = {
  lmStudioUrl:        process.env.LM_STUDIO_URL || 'http://host.docker.internal:1234',
  activeModel:        process.env.DEFAULT_MODEL  || 'google/gemma-3-4b',
  temperature:        0.7,
  maxTokens:          1000,
  systemPromptPrefix: 'You are the RansomFlow AI assistant.',
  streamingEnabled:   false,
  contextWindow:      4096,
  // 'native' = /api/v1/chat (LM Studio 1.x), 'openai' = /v1/chat/completions, 'auto' = try native first
  apiMode:            process.env.API_MODE || 'native',
};

// ─── Convert OpenAI messages → LM Studio native format ───────────────────────
function toNativeFormat(messages, model, temperature, maxTokens) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs  = messages.filter(m => m.role !== 'system');
  const input = userMsgs.length === 1
    ? userMsgs[0].content
    : userMsgs.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  return {
    model:         model,
    system_prompt: systemMsg?.content || settings.systemPromptPrefix,
    input,
    temperature,
    max_tokens:    maxTokens,
  };
}

// ─── Convert LM Studio native response → OpenAI format ───────────────────────
function toOpenAIFormat(nativeResp, model) {
  const content = nativeResp.output
    ?.filter(o => o.type === 'message')
    ?.map(o => o.content)
    ?.join('') || '';
  return {
    id:      nativeResp.response_id || ('chatcmpl-' + Date.now()),
    object:  'chat.completion',
    model:   nativeResp.model_instance_id || model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: {
      prompt_tokens:     nativeResp.stats?.input_tokens        || 0,
      completion_tokens: nativeResp.stats?.total_output_tokens || 0,
      total_tokens:      (nativeResp.stats?.input_tokens || 0) + (nativeResp.stats?.total_output_tokens || 0),
    },
  };
}

// ─── Core completion — tries native first, falls back to openai ──────────────
async function callLmStudio(messages, model, temperature, maxTokens) {
  const mode = settings.apiMode;

  if (mode === 'native' || mode === 'auto') {
    try {
      const resp = await axios.post(
        `${settings.lmStudioUrl}/api/v1/chat`,
        toNativeFormat(messages, model, temperature, maxTokens),
        { timeout: 60000 }
      );
      return toOpenAIFormat(resp.data, model);
    } catch (err) {
      if (mode === 'native') throw err; // hard native mode — don't fallback
      // auto mode — fallback to openai compat
    }
  }

  // OpenAI-compat mode
  const resp = await axios.post(
    `${settings.lmStudioUrl}/v1/chat/completions`,
    { model, messages, temperature, max_tokens: maxTokens },
    { timeout: 60000 }
  );
  return resp.data;
}

// ─── Settings API ─────────────────────────────────────────────────────────────
app.get('/settings', (req, res) => res.json({ settings, models: SUPPORTED_MODELS }));

app.post('/settings', (req, res) => {
  const allowed = ['lmStudioUrl','activeModel','temperature','maxTokens',
                   'systemPromptPrefix','streamingEnabled','contextWindow','apiMode'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  console.log(`[LM Proxy] Settings updated → model: ${settings.activeModel} | mode: ${settings.apiMode}`);
  res.json({ ok: true, settings });
});

app.get('/models', (req, res) => res.json({ models: SUPPORTED_MODELS, active: settings.activeModel }));

// ─── Health check — connection check only, no inference ──────────────────────
// ECONNREFUSED = LM Studio OFF | 404/405/any other = LM Studio ON (endpoint varies by version)
app.get('/health', async (req, res) => {
  try {
    await axios.get(`${settings.lmStudioUrl}/api/v1/models`, { timeout: 3000 });
    return res.json({ status: 'ok', lmStudio: 'connected', model: settings.activeModel, apiMode: settings.apiMode });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.json({ status: 'degraded', lmStudio: 'unreachable', model: settings.activeModel, error: 'LM Studio not running' });
    }
    // 404 / 405 / timeout on this specific endpoint = LM Studio IS running, just different API version
    // Confirm by hitting base URL
    try {
      await axios.get(settings.lmStudioUrl, { timeout: 3000 });
    } catch (e2) {
      if (e2.code === 'ECONNREFUSED' || e2.code === 'ENOTFOUND') {
        return res.json({ status: 'degraded', lmStudio: 'unreachable', model: settings.activeModel, error: 'LM Studio not running' });
      }
    }
    // Any response (even 404) from base URL = server is up
    return res.json({ status: 'ok', lmStudio: 'connected', model: settings.activeModel, apiMode: settings.apiMode });
  }
});

app.get('/v1/models', (req, res) => {
  res.json({ data: SUPPORTED_MODELS.map(m => ({ id: m.id, object: 'model', owned_by: 'local' })) });
});

// ─── Main proxy endpoint ──────────────────────────────────────────────────────
app.post('/v1/chat/completions', async (req, res) => {
  const model       = req.body.model       || settings.activeModel;
  const temperature = req.body.temperature ?? settings.temperature;
  const maxTokens   = req.body.max_tokens  ?? settings.maxTokens;
  const messages    = req.body.messages    || [];

  try {
    const result = await callLmStudio(messages, model, temperature, maxTokens);
    res.json(result);
  } catch (err) {
    console.warn(`[LM Proxy] Error: ${err.message}`);
    res.json({
      id: 'mock-' + Date.now(), object: 'chat.completion', model,
      choices: [{ index: 0, message: { role: 'assistant',
        content: `[Mock] LM Studio unreachable at ${settings.lmStudioUrl}. Start LM Studio and load ${model}.`
      }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }
});

const PORT = process.env.PROXY_PORT || 4000;
app.listen(PORT, () => {
  console.log(`[LM Proxy] :${PORT} → ${settings.lmStudioUrl}`);
  console.log(`[LM Proxy] Model: ${settings.activeModel} | Mode: ${settings.apiMode}`);
});