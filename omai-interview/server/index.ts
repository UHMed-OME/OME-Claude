import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { configRouter } from './routes/config.js'
import { sessionRouter } from './routes/session.js'
import { ttsRouter } from './routes/tts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

app.use('/api/config', configRouter)
app.use('/api/session', sessionRouter)
app.use('/api/tts', ttsRouter)
app.get('/healthz', (_req, res) => res.json({ ok: true }))

// Serve built React frontend
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => {
  console.log(`OMAI server running on http://localhost:${port}`)
})
