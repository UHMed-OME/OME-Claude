import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// Used for post-session features (summaries, scoring) — NOT for live session.
// During live sessions, NavTalk's backend makes the LLM calls.
export function createAIClient() {
  const provider = process.env.AI_PROVIDER ?? 'openai-compatible'
  if (provider === 'anthropic') {
    return new Anthropic({ apiKey: process.env.AI_API_KEY })
  }
  return new OpenAI({
    baseURL: process.env.AI_BASE_URL ?? 'https://openrouter.ai/api/v1',
    apiKey: process.env.AI_API_KEY ?? '',
  })
}
