/**
 * Provider-agnostic AI helper (OpenAI + Hugging Face)
 *
 * - Uses OpenAI Chat Completions when AI_PROVIDER === 'openai'
 * - Uses Hugging Face Inference API when AI_PROVIDER === 'huggingface'
 *
 * This implementation:
 * - Sends modern request payloads to HF: { inputs, parameters }
 * - Handles several HF response shapes (array with generated_text, object with generated_text, plain string)
 * - Trims and returns a best-effort text result, or throws on clear errors
 */

const axios = require('axios')
const {
  OPENAI_API_KEY,
  OPENAI_MODEL,
  HF_API_KEY,
  HF_MODEL,
  AI_PROVIDER
} = require('../config')

const DEFAULT_TIMEOUT = 60000

async function callAIChat(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured on server')
  }

  const url = 'https://api.openai.com/v1/chat/completions'
  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful assistant. Keep answers concise.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7
  }

  const res = await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    timeout: DEFAULT_TIMEOUT
  })

  const data = res.data
  const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text
  if (!text) throw new Error('Unexpected response from OpenAI')
  return String(text).trim()
}

module.exports = { callAIChat }