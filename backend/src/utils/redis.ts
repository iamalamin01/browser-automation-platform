import IORedis from 'ioredis';
import logger from './logger';

export const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // required for BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('❌ Redis error:', err));

export default redis;
