const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SUPPORTED_MODELS = [
  { id: 'gemma3:4b',           name: 'Gemma 3 4B (Ollama)',     size: '3.3GB', speed: 'fast',   recommended: true  },
  { id: 'google/gemma-3-4b',   name: 'Gemma 3 4B (LM Studio)',  size: '2.5GB', speed: 'fast',   recommended: false },
  { id: 'qwen2.5:7b',          name: 'Qwen 2.5 7B (Ollama)',    size: '4.7GB', speed: 'fast',   recommended: false },
  { id: 'qwen2.5-7b-instruct', name: 'Qwen 2.5 7B (LM Studio)', size: '4.7GB', speed: 'fast',   recommended: false },
  { id: 'llama3.2:3b',         name: 'LLaMA 3.2 3B (Ollama)',   size: '2.0GB', speed: 'fast',   recommended: false },
  { id: 'llama3.1:8b',         name: 'LLaMA 3.1 8B (Ollama)',   size: '4.9GB', speed: 'medium', recommended: false },
  { id: 'mistral:7b',          name: 'Mistral 7B (Ollama)',     size: '4.1GB', speed: 'fast',   recommended: false },
  { id: 'deepseek-r1:7b',      name: 'DeepSeek R1 7B (Ollama)', size: '4.7GB', speed: 'medium', recommended: false },
];

let settings = {
  lmStudioUrl:        process.env.LM_STUDIO_URL || 'http://localhost:11434',
  activeModel:        process.env.DEFAULT_MODEL  || 'gemma3:4b',
  temperature:        0.7,
  maxTokens:          1000,
  systemPromptPrefix: 'You are the RansomFlow AI assistant.',
  streamingEnabled:   false,
  contextWindow:      4096,
  apiMode:            process.env.API_MODE || 'ollama',
};

// Ollama: POST /api/chat
async function callOllama(messages, model, temperature, maxTokens) {
  const resp = await axios.post(
    ,
    { model, messages, stream: false, options: { temperature, num_predict: maxTokens } },
    { timeout: 120000 }
  );
  const content = resp.data?.message?.content || '';
  return {
    id: 'ollama-' + Date.now(), object: 'chat.completion', model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: resp.data?.prompt_eval_count || 0, completion_tokens: resp.data?.eval_count || 0, total_tokens: (resp.data?.prompt_eval_count || 0) + (resp.data?.eval_count || 0) },
  };
}

// LM Studio native: POST /api/v1/chat
function toNativeFormat(messages, model, temperature, maxTokens) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs  = messages.filter(m => m.role !== 'system');
  const input = userMsgs.length === 1 ? userMsgs[0].content : userMsgs.map(m => ).join('
');
  return { model, system_prompt: systemMsg?.content || settings.systemPromptPrefix, input, temperature, max_tokens: maxTokens };
}

function toOpenAIFormat(nativeResp, model) {
  const content = nativeResp.output?.filter(o => o.type === 'message')?.map(o => o.content)?.join('') || '';
  return {
    id: nativeResp.response_id || ('chatcmpl-' + Date.now()), object: 'chat.completion', model: nativeResp.model_instance_id || model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: nativeResp.stats?.input_tokens || 0, completion_tokens: nativeResp.stats?.total_output_tokens || 0, total_tokens: (nativeResp.stats?.input_tokens || 0) + (nativeResp.stats?.total_output_tokens || 0) },
  };
}

async function callLmStudio(messages, model, temperature, maxTokens) {
  if (settings.apiMode === 'ollama') return callOllama(messages, model, temperature, maxTokens);
  if (settings.apiMode === 'native') {
    const resp = await axios.post(, toNativeFormat(messages, model, temperature, maxTokens), { timeout: 60000 });
    return toOpenAIFormat(resp.data, model);
  }
  const resp = await axios.post(, { model, messages, temperature, max_tokens: maxTokens }, { timeout: 60000 });
  return resp.data;
}

app.get('/settings', (req, res) => res.json({ settings, models: SUPPORTED_MODELS }));

app.post('/settings', (req, res) => {
  const allowed = ['lmStudioUrl','activeModel','temperature','maxTokens','systemPromptPrefix','streamingEnabled','contextWindow','apiMode'];
  for (const key of allowed) { if (req.body[key] !== undefined) settings[key] = req.body[key]; }
  console.log();
  res.json({ ok: true, settings });
});

app.get('/models', (req, res) => res.json({ models: SUPPORTED_MODELS, active: settings.activeModel }));

app.get('/health', async (req, res) => {
  try {
    const endpoint = settings.apiMode === 'ollama' ? '/api/tags' : '/api/v1/models';
    await axios.get(, { timeout: 3000 });
    return res.json({ status: 'ok', lmStudio: 'connected', model: settings.activeModel, apiMode: settings.apiMode });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')
      return res.json({ status: 'degraded', lmStudio: 'unreachable', model: settings.activeModel, error: 'Server not running' });
    return res.json({ status: 'ok', lmStudio: 'connected', model: settings.activeModel, apiMode: settings.apiMode });
  }
});

app.get('/v1/models', (req, res) => res.json({ data: SUPPORTED_MODELS.map(m => ({ id: m.id, object: 'model', owned_by: 'local' })) }));

app.post('/v1/chat/completions', async (req, res) => {
  const model = req.body.model || settings.activeModel;
  const temperature = req.body.temperature ?? settings.temperature;
  const maxTokens = req.body.max_tokens ?? settings.maxTokens;
  const messages = req.body.messages || [];
  try {
    res.json(await callLmStudio(messages, model, temperature, maxTokens));
  } catch (err) {
    console.warn();
    res.json({ id: 'mock-' + Date.now(), object: 'chat.completion', model, choices: [{ index: 0, message: { role: 'assistant', content:  }, finish_reason: 'stop' }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
  }
});

const PORT = process.env.PROXY_PORT || 4000;
app.listen(PORT, () => {
  console.log();
  console.log();
}); 
