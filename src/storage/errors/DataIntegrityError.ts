import { CustomError } from '../../lib/errors/CustomError'

export class DataIntegrityError extends CustomError {
  readonly statusCode = 500

  constructor(message: string | object) {
    super('api_error', message)
  }
}
