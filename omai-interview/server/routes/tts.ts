import { Router } from 'express'
import { ElevenLabsTTS } from '../lib/tts/elevenlabs.js'
export const ttsRouter = Router()

ttsRouter.post('/', async (req, res) => {
  const { text } = req.body as { text?: string }
  if (!text) {
    res.status(400).json({ error: 'text required' })
    return
  }
  const provider = new ElevenLabsTTS(
    process.env.ELEVENLABS_API_KEY ?? '',
    process.env.ELEVENLABS_VOICE_ID ?? '',
  )
  res.setHeader('Content-Type', 'audio/pcm')
  res.setHeader('Transfer-Encoding', 'chunked')
  try {
    for await (const chunk of provider.synthesizeStream(text)) {
      res.write(chunk)
    }
    res.end()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'TTS error'
    if (!res.headersSent) res.status(500).json({ error: msg })
  }
})
