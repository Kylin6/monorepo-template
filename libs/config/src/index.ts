export interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  MYSQL_DB: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  QUEUE_REDIS_DB?: number;
}

export function loadConfig(): AppConfig {
  return {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 3000),
    MYSQL_HOST: process.env.MYSQL_HOST ?? 'localhost',
    MYSQL_PORT: Number(process.env.MYSQL_PORT ?? 3306),
    MYSQL_USER: process.env.MYSQL_USER ?? 'root',
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ?? 'password',
    MYSQL_DB: process.env.MYSQL_DB ?? 'app',
    REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
    REDIS_PORT: Number(process.env.REDIS_PORT ?? 6379),
    QUEUE_REDIS_DB: process.env.QUEUE_REDIS_DB
      ? Number(process.env.QUEUE_REDIS_DB)
      : undefined,
  };
}

