import express from 'express'
import { Request, Response } from 'express'
import { StoppableServer } from 'stoppable'
import prometheus from 'prom-client'

export function createOpsApp(appServer: StoppableServer) {
  const app = express()

  app.get('/healthz', (_req: Request, res: Response) => {
    const status = appServer.listening ? 200 : 503
    res.status(status)
    res.json({ status, dependencies: {} })
  })

  app.get('/metrics', (_req: Request, res: Response) => {
    res.end(prometheus.register.metrics())
  })

  return app
}

prometheus.collectDefaultMetrics()
