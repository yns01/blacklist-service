import dotenv from 'dotenv'
import { RedisOptions } from 'ioredis'

dotenv.config({ path: '.env' })

const redis: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
  lazyConnect: true,
}

export const config = {
  redis,
}
