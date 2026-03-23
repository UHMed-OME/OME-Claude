import { ElevenLabsTTS } from './elevenlabs'
import { QwenTTS } from './qwen'

export interface TTSProvider {
  synthesize(text: string): Promise<ArrayBuffer>
  synthesizeStream(text: string): AsyncIterable<Uint8Array>
}

export type TTSProviderName = 'elevenlabs' | 'qwen'

interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
}

export function createTTSProvider(
  name: TTSProviderName,
  config: ElevenLabsConfig | Record<string, string>
): TTSProvider {
  if (name === 'elevenlabs') {
    return new ElevenLabsTTS(config as ElevenLabsConfig)
  }
  if (name === 'qwen') {
    return new QwenTTS()
  }
  throw new Error(`Unknown TTS provider: ${name}`)
}
