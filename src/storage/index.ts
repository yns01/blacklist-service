import Redis from 'ioredis'
import { config } from '../config'

export enum REDIS_TYPES {
  PLUS_INFINITY = '+INF',
  LIMIT = 'LIMIT',
  WITHSCORES = 'WITHSCORES',
}

// SetMembers are elements which belongs to the same set
// Each SetMember is made of the actual member and its score
export type SetMembers = string[]

const redis = new Redis(config.redis)
const redisSubClient = new Redis(config.redis)

export { redis, redisSubClient }
