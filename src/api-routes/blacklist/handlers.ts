import { Request, Response, NextFunction } from 'express'
import * as blacklistService from '../../services/blacklist'
import { CustomError, ValidationError } from '../../lib/errors/'
import { isIPv4 } from 'net'

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const ip: string | undefined = req.query.ip

    if (!ip) {
      throw new ValidationError('missing IP parameter')
    }

    if (!isIPv4(ip)) {
      throw new ValidationError('not an IPv4 IP')
    }

    const blacklistedIps = await blacklistService.getBlacklistSources(ip)

    res.status(200).send({ results: blacklistedIps })
  } catch (error) {
    next(error)
  }
}

export async function updateFromSource(req: Request, res: Response, next: NextFunction) {
  try {
    const source: string = req.body.source

    if (!source) {
      throw new ValidationError('invalid body, missing blacklists')
    }

    await blacklistService.updateBlacklistFromSource(source)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (!(err instanceof CustomError)) {
    return next(err)
  }

  return res.status(err.statusCode).send({
    error: {
      code: err.code,
      message: err.message,
    },
  })
}
