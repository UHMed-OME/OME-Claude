import { Router } from 'express'
import { createNavtalkSessionConfig } from '../lib/navtalk.js'
export const sessionRouter = Router()

sessionRouter.post('/', (_req, res) => {
  try {
    const config = createNavtalkSessionConfig()
    res.json(config)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})
