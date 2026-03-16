import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker } from "bullmq";
import { QUEUE_NAMES } from "@common/index";
import type { TronDelegateJobData, TronReclaimJobData } from "@common/index";
import { TronResourceService } from "../../services/tron-resource";
import { getQueueConnection } from "@queue/index";

/** 从 common 导出，供 tron-queue.service 等使用 */
export type { TronDelegateJobData, TronReclaimJobData };

@Injectable()
export class TronQueueProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TronQueueProcessor.name);
  private workers: Array<Worker<any, any, any>> = [];

  constructor(private readonly tronResource: TronResourceService) {}

  async onModuleInit() {
    const connection = getQueueConnection();

    const delegateWorker = new Worker<TronDelegateJobData, { txId: string }>(
      QUEUE_NAMES.TRON_DELEGATE,
      async (job) => {
        const data = job.data;
        if (!data?.toAddr) throw new Error("toAddr 不能为空");
        if (!data?.fromAddr) throw new Error("fromAddr 不能为空");
        if (!data?.resource) throw new Error("resource 不能为空");
        if (typeof data.amountTrx !== "number" || data.amountTrx <= 0) {
          throw new Error("amountTrx 必须为 > 0 的 number");
        }

        // 接收到信息
        // 打印信息
        this.logger.log(`接收到信息: ${JSON.stringify(data)}`);

        const txId = await this.tronResource.delegateResource({
          receiverAddress: data.toAddr,
          resource: data.resource,
          amountSun: TronResourceService.trxToSun(data.amountTrx),
          lock: data.lock,
          lockPeriod: data.lockPeriod,
          ownerAddress: data.fromAddr,
        });
        return { txId };
      },
      { connection }
    );

    delegateWorker.on("completed", (job, result) => {
      this.logger.log(
        `delegate completed jobId=${job.id} txId=${result?.txId ?? "unknown"}`
      );
    });
    delegateWorker.on("failed", (job, err) => {
      this.logger.error(`delegate failed jobId=${job?.id}`, err);
    });

    const reclaimWorker = new Worker<TronReclaimJobData, { txId: string }>(
      QUEUE_NAMES.TRON_RECLAIM,
      async (job) => {
        const data = job.data;
        if (!data?.toAddr) throw new Error("toAddr 不能为空");
        if (!data?.fromAddr) throw new Error("fromAddr 不能为空");
        if (!data?.resource) throw new Error("resource 不能为空");
        if (typeof data.amountTrx !== "number" || data.amountTrx <= 0) {
          throw new Error("amountTrx 必须为 > 0 的 number");
        }

        const txId = await this.tronResource.undelegateResource({
          receiverAddress: data.toAddr,
          resource: data.resource,
          amountSun: TronResourceService.trxToSun(data.amountTrx),
          ownerAddress: data.fromAddr,
        });
        return { txId };
      },
      { connection }
    );

    reclaimWorker.on("completed", (job, result) => {
      this.logger.log(
        `reclaim completed jobId=${job.id} txId=${result?.txId ?? "unknown"}`
      );
    });
    reclaimWorker.on("failed", (job, err) => {
      this.logger.error(`reclaim failed jobId=${job?.id}`, err);
    });

    this.workers = [delegateWorker, reclaimWorker];
    this.logger.log(
      `TronQueueProcessor workers started: ${QUEUE_NAMES.TRON_DELEGATE}, ${QUEUE_NAMES.TRON_RECLAIM}`
    );
  }

  async onModuleDestroy() {
    await Promise.all(
      this.workers.map((w) => w.close().catch(() => undefined))
    );
    this.workers = [];
  }
}
