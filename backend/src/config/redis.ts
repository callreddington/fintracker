import { logger } from '@utils/logger';
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function initializeRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL not set. Redis features will be disabled.');
    throw new Error('REDIS_URL environment variable is required');
  }

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error('Redis reconnection attempts exceeded');
            return new Error('Redis connection failed');
          }
          const delay = Math.min(retries * 100, 3000);
          logger.info(`Retrying Redis connection in ${delay}ms...`);
          return delay;
        },
      },
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    await redisClient.connect();

    // Test the connection
    await redisClient.ping();

    logger.info('Redis connection established');

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

export function getRedis(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

// Cache helper functions
export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedis();
  return await client.get(key);
}

export async function cacheSet(key: string, value: string, expirySeconds?: number): Promise<void> {
  const client = getRedis();
  if (expirySeconds) {
    await client.setEx(key, expirySeconds, value);
  } else {
    await client.set(key, value);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  await client.del(key);
}

export async function cacheExists(key: string): Promise<boolean> {
  const client = getRedis();
  const exists = await client.exists(key);
  return exists === 1;
}

export { redisClient };
