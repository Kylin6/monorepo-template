import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker } from "bullmq";
import { U2T_EXCHANGE_QUEUE_KEY } from "@common/index";
import { getQueueConnection } from "@queue/index";
import {
  Exchange,
  U2T_EXCHANGE_STATUS,
  getDataSource,
  getSysCfgRepository,
} from "@database/index";
import { TronResourceService } from "../../services/tron-resource";
import { TronHelper } from "@database/helper/tron.helper";

interface U2TExchangeJobPayload {
  exchangeId: number;
}

/**
 * 对标 PHP WatchExchange subscribe(Exchange::U2T_EXCHANGE_QUEUE_KEY, ...)
 * - 读取 exchange 记录（pending）
 * - 从 QuickU2T 钱包转出 TRX 到用户地址（record.from）
 * - 更新 exchange 状态为 processing 并写 transferOutTxId/transferedAt
 */
@Injectable()
export class WatchExchangeProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WatchExchangeProcessor.name);
  private worker: Worker<U2TExchangeJobPayload> | null = null;

  constructor(private readonly tronResource: TronResourceService) {}

  async onModuleInit() {
    const connection = getQueueConnection();
    this.worker = new Worker<U2TExchangeJobPayload>(
      U2T_EXCHANGE_QUEUE_KEY,
      async (job) => {
        const id = Number(job.data?.exchangeId ?? 0);
        if (!id) return;
        await this.processExchange(id);
      },
      { connection }
    );

    this.worker.on("completed", (job) => {
      this.logger.log(
        `u换t 交易完成 exchangeId=${job.data.exchangeId} jobId=${job.id}`
      );
    });
    this.worker.on("failed", (job, err) => {
      this.logger.error(
        `u换t 交易失败 exchangeId=${job?.data?.exchangeId} jobId=${job?.id}`,
        err
      );
    });

    this.logger.log(
      `WatchExchangeProcessor started: ${U2T_EXCHANGE_QUEUE_KEY}`
    );
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  private async processExchange(exchangeId: number) {
    const ds = await getDataSource();
    const exchangeRepo = ds.getRepository(Exchange);

    const record = await exchangeRepo.findOne({
      where: { id: exchangeId, status: U2T_EXCHANGE_STATUS.PENDING },
    });
    if (!record) return;

    const sysCfgRepo = await getSysCfgRepository();
    const u2tOutAddrRow = await sysCfgRepo.findOne({
      where: { key: "u2tOutTAddr" },
      select: ["value"],
    });
    const u2tOutTAddr = u2tOutAddrRow?.value?.trim();
    if (!u2tOutTAddr) {
      record.status = U2T_EXCHANGE_STATUS.UNKNOWN;
      await exchangeRepo.save(record);
      return;
    }

    const amountTrx = Number(record.exchange ?? 0);
    if (!Number.isFinite(amountTrx) || amountTrx <= 0) {
      record.status = U2T_EXCHANGE_STATUS.UNKNOWN;
      await exchangeRepo.save(record);
      return;
    }

    const now = Math.floor(Date.now() / 1000);

    try {
      const txId = await this.tronResource.transferTrx({
        fromAddress: u2tOutTAddr,
        toAddress: record.from,
        amountSun: TronHelper.toSun(amountTrx),
      });

      record.transferOutTxId = txId;
      record.transferedAt = now;
      record.status = U2T_EXCHANGE_STATUS.PROCESSING;
      await exchangeRepo.save(record);
    } catch (e) {
      record.status = U2T_EXCHANGE_STATUS.UNKNOWN;
      await exchangeRepo.save(record);
      throw e;
    }
  }
}
