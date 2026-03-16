import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";
import { TelegramBotService } from "../bot/telegram-bot.service";
import { getQueueConnection } from "@queue/index";
import { TELEGRAM_DURATION_ORDER_NOTIFY } from "@common/index";

/** 与 scheduler duration-order-sync 投递的 payload 一致 */
export interface DurationOrderNotifyPayload {
  telegramId: string;
  orderId: number;
  amount: string;
  toAddr: string;
  totalCost: number;
  balance: number;
  type: string;
}

@Injectable()
export class DurationOrderNotifyProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DurationOrderNotifyProcessor.name);
  private worker: Worker<DurationOrderNotifyPayload> | null = null;

  constructor(private readonly telegramBotService: TelegramBotService) {}

  async onModuleInit(): Promise<void> {
    const connection = getQueueConnection();
    this.worker = new Worker<DurationOrderNotifyPayload>(
      TELEGRAM_DURATION_ORDER_NOTIFY,
      async (job) => this.handle(job),
      { connection }
    );

    this.worker.on("completed", (job) => {
      this.logger.log(
        `时长订单到账通知任务完成 jobId=${job.id} telegramId=${job.data.telegramId}`
      );
    });

    this.worker.on("failed", (job, err) => {
      this.logger.error(
        `时长订单到账通知任务失败 jobId=${job?.id} telegramId=${job?.data?.telegramId}`,
        err instanceof Error ? err.stack : String(err)
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  private async handle(job: Job<DurationOrderNotifyPayload>): Promise<void> {
    const { telegramId, orderId, amount, toAddr, type, totalCost, balance } =
      job.data;
    // this.logger.log(
    //   `处理时长订单到账通知 jobId=${job.id} telegramId=${telegramId} orderId=${orderId}`,
    // );

    if (!telegramId) {
      this.logger.warn(`jobId=${job.id} 缺少 telegramId，跳过`);
      return;
    }

    try {
      const typeLabel = type === "E" ? "能量" : "带宽";
      const text =
        `✅ 时长订单到账通知\n` +
        `订单号: ${orderId}\n` +
        `类型: ${typeLabel}\n` +
        `数量: ${amount}\n` +
        `目标地址: ${toAddr || "—"}\n` +
        `金额: ${totalCost}\n` +
        `余额: ${balance}\n`;
      await this.telegramBotService.sendMessageToUser(telegramId, text);
      this.logger.log(
        `时长订单到账通知已发送 telegramId=${telegramId} orderId=${orderId}`
      );
    } catch (e) {
      this.logger.error(
        `发送时长订单到账通知失败 telegramId=${telegramId} jobId=${job.id}`,
        e instanceof Error ? e.stack : String(e)
      );
      throw e;
    }
  }
}
