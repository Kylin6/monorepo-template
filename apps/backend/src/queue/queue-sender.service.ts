import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { IQueueSender } from "@common/index";

@Injectable()
export class QueueSenderService implements IQueueSender, OnModuleDestroy {
  private queues = new Map<string, Queue>();

  constructor(private readonly config: ConfigService) {}

  private getQueue(name: string): Queue {
    let q = this.queues.get(name);
    if (!q) {
      q = new Queue(name, {
        connection: {
          host: this.config.get<string>("REDIS_HOST", "localhost"),
          port: this.config.get<number>("REDIS_PORT", 6379),
          db: this.config.get<number>("QUEUE_REDIS_DB", 0),
        },
      });
      this.queues.set(name, q);
    }
    return q;
  }

  async send(
    queueKey: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const queue = this.getQueue(queueKey);
    await queue.add("default", payload);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    this.queues.clear();
  }
}
