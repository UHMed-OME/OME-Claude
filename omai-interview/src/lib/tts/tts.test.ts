import { describe, it, expect, vi } from 'vitest'
import { createTTSProvider } from './index'
import { QwenTTS } from './qwen'

describe('createTTSProvider', () => {
  it('creates ElevenLabsTTS for elevenlabs provider', () => {
    const provider = createTTSProvider('elevenlabs', { apiKey: 'test', voiceId: 'test' })
    expect(provider).toBeDefined()
    expect(typeof provider.synthesize).toBe('function')
    expect(typeof provider.synthesizeStream).toBe('function')
  })

  it('throws for unknown provider', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => createTTSProvider('unknown' as any, {})).toThrow()
  })
})

describe('QwenTTS stub', () => {
  const qwen = new QwenTTS()

  it('synthesize throws NotImplementedError', async () => {
    await expect(qwen.synthesize('test')).rejects.toThrow('QwenTTS is not yet implemented')
  })

  it('synthesizeStream throws NotImplementedError', async () => {
    const gen = qwen.synthesizeStream('test')
    await expect(gen.next()).rejects.toThrow('QwenTTS is not yet implemented')
  })
})
