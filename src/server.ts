import './config/'
import { promisify } from 'util'
import http from 'http'
import stoppable, { StoppableServer } from 'stoppable'
import { app } from './app'
import { logger } from './lib/logger'
import { redis } from './storage'

const defaultTerminationGracePeriods = 15 * 1000

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '3000'
app.set('port', port)

/**
 * Create HTTP app server.
 */

const appServer = stoppable(http.createServer(app), defaultTerminationGracePeriods)

/**
 * Event listener for HTTP server "error" event.
 */

const onError = (serverName: string) => (error: any) => {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${serverName}: ${bind} requires elevated privileges`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      logger.error(`${serverName}:${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = (serverName: string, server: StoppableServer) => () => {
  const addr = server.address()
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr ? addr.port : 'null'}`
  logger.info(`${serverName} listening on ${bind}`)
}

appServer.on('error', onError('appServer'))
appServer.on('listening', onListening('appServer', appServer))

redis
  .connect()
  .then(() => {
    appServer.listen(port)
  })
  .catch(err => {
    logger.error('Could not open database connection', err)
    process.exit(1)
  })

/**
 *
 * graceful shutdown
 *
 */
const handleError = (err: Error) => {
  logger.warn('Error happened during graceful shutdown', err)
  process.exit(1)
}

const handleSignal = (signal: string) => () => {
  logger.warn(`Got ${signal}. Graceful shutdown start`, new Date().toISOString())

  try {
    const stopAppServer = promisify(appServer.stop)

    stopAppServer()
      .then(() => {
        logger.warn('Successful graceful shutdown', new Date().toISOString())
        process.exit(0)
      })
      .catch(handleError)
  } catch (err) {
    handleError(err)
  }
}

process.on('SIGTERM', handleSignal('SIGTERM'))
process.on('SIGINT', handleSignal('SIGINT'))
