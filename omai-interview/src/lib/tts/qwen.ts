import type { TTSProvider } from './index'

export class QwenTTS implements TTSProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async synthesize(_text: string): Promise<ArrayBuffer> {
    throw new Error(
      'QwenTTS is not yet implemented. ' +
      'This is a stub for future self-hosted TTS support. ' +
      'Set TTS_PROVIDER=elevenlabs in your .env to use ElevenLabs.'
    )
  }

  async *synthesizeStream(_text: string): AsyncGenerator<Uint8Array> {
    throw new Error(
      'QwenTTS is not yet implemented. ' +
      'This is a stub for future self-hosted TTS support. ' +
      'Set TTS_PROVIDER=elevenlabs in your .env to use ElevenLabs.'
    )
    // Required for TypeScript generator typing:
    yield new Uint8Array()
  }
}
