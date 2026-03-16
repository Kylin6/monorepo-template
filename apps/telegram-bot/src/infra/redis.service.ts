import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type RedisClientType } from "redis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;

  constructor(private readonly configService: ConfigService) {}

  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error("Redis client not initialized yet");
    }
    return this.client;
  }

  async onModuleInit() {
    const host = this.configService.get<string>("REDIS_HOST", "localhost");
    const port = Number(this.configService.get<string>("REDIS_PORT") ?? 6379);
    const db = this.configService.get<string>("QUEUE_REDIS_DB");

    this.client = createClient({
      socket: {
        host,
        port,
        // 在受限环境中避免持续重连刷屏；生产环境如需重连，可改为默认策略
        reconnectStrategy: false,
      },
      database: db ? Number(db) : undefined,
    });

    this.client.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("Redis client error", err);
    });

    try {
      await this.client.connect();
      // eslint-disable-next-line no-console
      console.log("Telegram bot redis connected", { host, port, db: db ?? 0 });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Telegram bot redis connect failed", err);
      try {
        await this.client.quit();
      } catch {
        try {
          this.client.disconnect();
        } catch {
          // ignore
        }
      }
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}
