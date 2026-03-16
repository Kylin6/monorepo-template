import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Queue, type Worker } from "bullmq";
import { createQueueWorker, getExampleQueue } from "@queue/index";

@Injectable()
export class QueueInitService implements OnModuleInit, OnModuleDestroy {
  private exampleQueue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // 1) 连接队列（Redis）
    try {
      this.exampleQueue = await getExampleQueue();
      await this.exampleQueue.waitUntilReady();

      // eslint-disable-next-line no-console
      console.log("Telegram bot queue connected");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Telegram bot queue connect failed", err);
      this.exampleQueue = null;
      return;
    }

    // 2) 可选：在 bot 进程里启动一个示例 worker（默认不启用）
    const enableWorker = this.configService.get<string>(
      "TELEGRAM_BOT_ENABLE_QUEUE_WORKER",
      "false"
    );

    if (enableWorker === "true" || enableWorker === "1") {
      try {
        this.worker = await createQueueWorker();
        // eslint-disable-next-line no-console
        console.log("Telegram bot queue worker started");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Telegram bot queue worker start failed", err);
        this.worker = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.exampleQueue) {
      await this.exampleQueue.close();
      this.exampleQueue = null;
    }
  }
}
