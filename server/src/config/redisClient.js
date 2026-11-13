// Owner: M2 — shared Redis connection for distributed token-bucket counters.
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  connectTimeout: 1000,
  retryStrategy: (attempt) => Math.min(attempt * 100, 1000),
});

redis.on('error', (error) => {
  // Keep operational output useful without logging credentials or request data.
  if (process.env.NODE_ENV !== 'test') console.error(`Redis rate-limit connection error: ${error.message}`);
});

export default redis;
