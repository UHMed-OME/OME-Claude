import type { TTSProvider } from './index'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export class ElevenLabsTTS implements TTSProvider {
  private apiKey: string
  private voiceId: string

  constructor({ apiKey, voiceId }: { apiKey: string; voiceId: string }) {
    this.apiKey = apiKey
    this.voiceId = voiceId
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${this.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          output_format: 'pcm_16000',
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.status} ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  async *synthesizeStream(text: string): AsyncGenerator<Uint8Array> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${this.voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          output_format: 'pcm_16000',
        }),
      }
    )

    if (!response.ok || !response.body) {
      throw new Error(`ElevenLabs TTS stream error: ${response.status}`)
    }

    const reader = response.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }
}
