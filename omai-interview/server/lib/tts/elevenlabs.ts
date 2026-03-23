import type { TTSProvider } from './index.js'

export class ElevenLabsTTS implements TTSProvider {
  constructor(
    private readonly apiKey: string,
    private readonly voiceId: string,
  ) {}

  async synthesize(text: string): Promise<ArrayBuffer> {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          output_format: 'pcm_16000',
        }),
      },
    )
    if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`)
    return res.arrayBuffer()
  }

  async *synthesizeStream(text: string): AsyncIterable<Uint8Array> {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          output_format: 'pcm_16000',
        }),
      },
    )
    if (!res.ok) throw new Error(`ElevenLabs stream error: ${res.status}`)
    if (!res.body) throw new Error('No response body')
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield value
    }
  }
}
