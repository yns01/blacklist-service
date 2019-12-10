import * as blacklistsHandlers from '../handlers'
import { ValidationError } from '../../../lib/errors'
import * as blacklistService from '../../../services/blacklist'
import { BlacklistedIP } from '../../../domain/entities/BlacklistedIP'

describe('Blacklists handlers', () => {
  test('an empty query string', async () => {
    const req: any = {
      query: {},
    }
    const res: any = {
      send: jest.fn(),
    }
    const next = jest.fn()

    await blacklistsHandlers.get(req, res, next)
    expect(next).toBeCalledTimes(1)
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError)
  })

  test('not an IPv4 IP', async () => {
    const req: any = {
      query: {
        ip: 1,
      },
    }
    const res: any = {
      send: jest.fn(),
    }
    const next = jest.fn()

    await blacklistsHandlers.get(req, res, next)
    expect(next).toBeCalledTimes(1)
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError)
  })

  test('should call service and reply json', async () => {
    const req: any = {
      query: {
        ip: '1.1.1.1',
      },
    }
    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }
    const next = jest.fn()

    const blIP: BlacklistedIP = { ip: '1.1.1.1', source: 'b' }

    jest.spyOn(blacklistService, 'getBlacklistSources').mockResolvedValue(Promise.resolve([blIP]))

    await blacklistsHandlers.get(req, res, next)
    expect(next).toBeCalledTimes(0)
    expect(res.status).toBeCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toBeCalledTimes(1)
  })

  test('should properly encode known errors', async () => {
    const req: any = {}
    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }
    const next = jest.fn()

    const knownError = new ValidationError('a known error')
    blacklistsHandlers.errorHandler(knownError, req, res, next)
    expect(next).toBeCalledTimes(0)
    expect(res.status).toBeCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(knownError.statusCode)
    expect(res.send).toBeCalledTimes(1)
    expect(res.send).toBeCalledWith({
      error: {
        code: knownError.code,
        message: knownError.message,
      },
    })
  })

  test('should pass unknown error to generic error handler', async () => {
    const req: any = {}
    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }
    const next = jest.fn()

    const knownError = new Error('a generic error')
    blacklistsHandlers.errorHandler(knownError, req, res, next)
    expect(next).toBeCalledTimes(1)
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(res.status).toBeCalledTimes(0)
    expect(res.send).toBeCalledTimes(0)
  })
})
