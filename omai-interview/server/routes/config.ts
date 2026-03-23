import { Router } from 'express'
export const configRouter = Router()

configRouter.get('/', (_req, res) => {
  res.json({
    character: process.env.NAVTALK_CHARACTER ?? 'navtalk.Lauren',
  })
})
