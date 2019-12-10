import { Request, Response } from 'express'
import HttpStatus from 'http-status-codes'

export function notFoundHandler(_: Request, res: Response): void {
  res.status(HttpStatus.NOT_FOUND).json({
    error: {
      code: 'resource_not_found',
      message: 'The requested resource was not found',
    },
  })
}
