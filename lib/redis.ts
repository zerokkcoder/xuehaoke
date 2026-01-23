import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis }

const options: import('ioredis').RedisOptions = {}
if (process.env.REDIS_PASSWORD) {
  options.password = process.env.REDIS_PASSWORD
}

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', options)

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export default redis
