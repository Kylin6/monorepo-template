import { createClient, RedisClientType } from 'redis';
import { loadConfig } from '@config/index';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client) {
    return client;
  }
  const config = loadConfig();

  client = createClient({
    socket: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    },
  });

  await client.connect();
  return client;
}

