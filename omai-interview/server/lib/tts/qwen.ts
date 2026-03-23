import type { TTSProvider } from './index.js'

// Future self-hosted TTS — stub only for MVP
export class QwenTTS implements TTSProvider {
  async synthesize(_text: string): Promise<ArrayBuffer> {
    throw new Error('QwenTTS not implemented in MVP')
  }
  async *synthesizeStream(_text: string): AsyncIterable<Uint8Array> {
    throw new Error('QwenTTS not implemented in MVP')
  }
}
