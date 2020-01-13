import { Router } from 'express'
import { Request, Response } from 'express'
import prometheus from 'prom-client'

const router: Router = Router()
prometheus.collectDefaultMetrics()

router.get('/healthz', (_req: Request, res: Response) => {
  res.status(200)
  res.json({ dependencies: {} })
})

router.get('/metrics', (_req: Request, res: Response) => {
  res.end(prometheus.register.metrics())
})

export { router as platformRoutes }
