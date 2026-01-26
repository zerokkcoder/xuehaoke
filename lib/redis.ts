import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis }

const options: import('ioredis').RedisOptions = {}
if (process.env.REDIS_PASSWORD) {
  options.password = process.env.REDIS_PASSWORD
}

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    ...options,
    // Add retry strategy to avoid crashing on connection loss
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    maxRetriesPerRequest: 3,
  })

// Prevent unhandled error logs crashing the app or spamming terminal
redis.on('error', (err) => {
  // Suppress ECONNRESET errors which are common in dev/unstable networks
  if ((err as any)?.code === 'ECONNRESET') {
    // Silent or minimal log
    return
  }
  console.warn('[Redis] Connection error:', err.message)
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

export default redis
