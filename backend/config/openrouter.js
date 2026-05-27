const axios = require('axios');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'google/gemini-3.5-flash';

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

/**
 * Send a chat completion request to OpenRouter
 * @param {Array} messages - Array of {role, content} message objects
 * @param {Object} options - Optional overrides (model, temperature, max_tokens)
 * @returns {Object} - The AI response
 */
const chatCompletion = async (messages, options = {}) => {
  const response = await openRouterClient.post('/chat/completions', {
    model: options.model || DEFAULT_MODEL,
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 2048,
  });

  return response.data;
};

module.exports = { openRouterClient, chatCompletion, DEFAULT_MODEL };
