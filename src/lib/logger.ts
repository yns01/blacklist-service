import winston from 'winston'

const { combine, json, timestamp } = winston.format

const env = process.env.NODE_ENV || 'development'
const logLevel = process.env.LOG_LEVEL || 'warn'

const getWinstonTransportConfig = () => {
  return new winston.transports.Console({
    level: logLevel,
  })
}

const logger = winston.createLogger({
  format: combine(timestamp(), json({ space: env !== 'production' ? 2 : 0 })),
  transports: [getWinstonTransportConfig()],
})

export { logger }
