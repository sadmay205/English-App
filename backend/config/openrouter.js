const axios = require('axios');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'google/gemma-4-31b-it:free';

/**
 * Creates an Axios instance pre-configured for OpenRouter API
 */
const openRouterClient = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'English Learning App',
  },
});

const FALLBACK_MODELS = [
  'liquid/lfm-2.5-1.2b-instruct:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
];

/**
 * Send a chat completion request to OpenRouter
 * @param {Array} messages - Array of {role, content} message objects
 * @param {Object} options - Optional overrides (model, temperature, max_tokens)
 * @returns {Object} - The AI response
 */
const chatCompletion = async (messages, options = {}) => {
  const modelsToTry = [];
  if (options.model) {
    modelsToTry.push(options.model);
  }
  modelsToTry.push(DEFAULT_MODEL);
  for (const m of FALLBACK_MODELS) {
    if (m !== DEFAULT_MODEL) {
      modelsToTry.push(m);
    }
  }

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      console.log(`Sending chat completion request to model: ${model}`);
      const response = await openRouterClient.post('/chat/completions', {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
      });

      // Verify the response contains choices and no internal OpenRouter errors
      if (response.data && !response.data.error && response.data.choices && response.data.choices[0]) {
        return response.data;
      }

      // If we got here, it returned a 200 OK but with error content or missing choices
      const errorMsg = response.data && response.data.error
        ? (response.data.error.message || JSON.stringify(response.data.error))
        : 'Response data lacks valid choices';
      throw new Error(errorMsg);
    } catch (error) {
      console.error(`Failed to request model ${model}: ${error.message}`);
      if (error.response && error.response.data) {
        console.error("OpenRouter Error response:", JSON.stringify(error.response.data.error || error.response.data));
      }
      lastError = error;
    }
  }
  throw lastError;
};

module.exports = { openRouterClient, chatCompletion, DEFAULT_MODEL };
