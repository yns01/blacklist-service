import { CustomError } from './CustomError'

export class ValidationError extends CustomError {
  readonly statusCode = 400

  constructor(message: string | object) {
    super('invalid_request', message)
  }
}
