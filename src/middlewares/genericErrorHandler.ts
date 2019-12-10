import { Request, Response, NextFunction } from 'express'
import HttpStatus from 'http-status-codes'
import { logger } from '../lib/logger'

export const genericErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(err.message, err)
  if (process.env.NODE_ENV === 'production') {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: {
        code: 'generic',
        message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR),
      },
    })
  } else {
    res.status(500).send(err.stack)
  }
}
