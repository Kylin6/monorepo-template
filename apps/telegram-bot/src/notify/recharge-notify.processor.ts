import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";
import { TelegramBotService } from "../bot/telegram-bot.service";
import { getQueueConnection } from "@queue/index";
import { TELEGRAM_RECHARGE_NOTIFY } from "@common/index";

/** 与 scheduler 投递的 payload 结构一致 */
export interface RechargeNotifyPayload {
  telegramId: string;
  amount: number;
  newBalance: number;
  currency: string;
  txId: string;
  rechargeApplyId: number;
}

@Injectable()
export class RechargeNotifyProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RechargeNotifyProcessor.name);
  private worker: Worker<RechargeNotifyPayload> | null = null;

  constructor(private readonly telegramBotService: TelegramBotService) {}

  async onModuleInit(): Promise<void> {
    const connection = getQueueConnection();
    this.worker = new Worker<RechargeNotifyPayload>(
      TELEGRAM_RECHARGE_NOTIFY,
      async (job) => this.handle(job),
      { connection }
    );

    this.worker.on("completed", (job) => {
      this.logger.log(
        `充值通知任务已完成 jobId=${job.id} telegramId=${job.data.telegramId}`
      );
    });

    this.worker.on("failed", (job, err) => {
      this.logger.error(
        `充值通知任务失败 jobId=${job?.id} telegramId=${job?.data?.telegramId}`,
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

  private async handle(job: Job<RechargeNotifyPayload>): Promise<void> {
    const { telegramId, amount, currency, newBalance } = job.data;
    this.logger.log(
      `处理充值通知 jobId=${job.id} telegramId=${telegramId} amount=${amount} ${currency}`
    );

    if (!telegramId) {
      this.logger.warn(`jobId=${job.id} 缺少 telegramId，跳过`);
      return;
    }

    try {
      const text =
        `📣📣 充值到账提醒 \n` +
        `充值金额: ${amount} ${currency} 。账户余额: ${newBalance} TRX\n`;
      await this.telegramBotService.sendMessageToUser(telegramId, text);
      this.logger.log(`充值通知已发送 telegramId=${telegramId}`);
    } catch (e) {
      this.logger.error(
        `发送充值通知失败 telegramId=${telegramId} jobId=${job.id}`,
        e instanceof Error ? e.stack : String(e)
      );
      throw e;
    }
  }
}
