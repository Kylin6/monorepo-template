import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker } from "bullmq";
import { SYNC_PLAN_ADDR_TRANSACTION_QUEUE_KEY } from "@common/index";
import { getQueueConnection } from "@queue/index";
import { getDataSource, PlanTransaction } from "@database/index";
import { TronHelper } from "@database/helper/tron.helper";
import { TronResourceService } from "../../services/tron-resource";

interface SyncPlanTransactionJobPayload {
  id: number;
}

/**
 * 对标 PHP RedisQueueHelper::subscribe('sync:plan:addr:transaction', ...)
 * - 查 gettransactioninfobyid
 * - 回写 plan_transaction.energyFee/energyUsage/bandwidthFee/bandwidthUsage/transferAt/contractAddr/status
 */
@Injectable()
export class SyncPlanTransactionProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SyncPlanTransactionProcessor.name);
  private worker: Worker<SyncPlanTransactionJobPayload> | null = null;

  constructor(private readonly tronResource: TronResourceService) {}

  async onModuleInit() {
    const connection = getQueueConnection();
    this.worker = new Worker<SyncPlanTransactionJobPayload>(
      SYNC_PLAN_ADDR_TRANSACTION_QUEUE_KEY,
      async (job) => {
        const id = Number(job.data?.id ?? 0);
        if (!id) return;
        await this.processOne(id);
      },
      { connection },
    );

    this.worker.on("failed", (job, err) => {
      this.logger.error(
        `sync plan tx failed id=${job?.data?.id} jobId=${job?.id}`,
        err,
      );
    });
    this.worker.on("completed", (job) => {
      this.logger.log(`sync plan tx done id=${job.data.id} jobId=${job.id}`);
    });

    this.logger.log(
      `SyncPlanTransactionProcessor started: ${SYNC_PLAN_ADDR_TRANSACTION_QUEUE_KEY}`,
    );
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }

  private async processOne(ptId: number) {
    const ds = await getDataSource();
    const repo = ds.getRepository(PlanTransaction);
    const pt = await repo.findOne({ where: { id: ptId } });
    if (!pt) return;
    if (pt.status !== 0) return;
    if (!pt.txId) return;

    const info = await this.tronResource.getTransactionInfoById(pt.txId);
    // console.log("托管交易", ptId, info);
    // 在未上链/未出 receipt 时，TronGrid 往往返回空对象
    if (!info || typeof info !== "object" || !("receipt" in info)) {
      return;
    }

    const receipt: any = (info as any).receipt ?? {};
    const energyFeeSun = Number(receipt.energy_fee ?? 0);
    const netFeeSun = Number(receipt.net_fee ?? receipt.bandwidth_fee ?? 0);

    const energyFee = Number.isFinite(energyFeeSun)
      ? TronHelper.fromSun(energyFeeSun)
      : 0;
    const bandwidthFee = Number.isFinite(netFeeSun)
      ? TronHelper.fromSun(netFeeSun)
      : 0;

    const transferAt = Number((info as any).blockTimeStamp)
      ? Math.floor(Number((info as any).blockTimeStamp) / 1000)
      : null;

    pt.energyFee = String(energyFee);
    pt.energyUsage = Number(receipt.energy_usage ?? 0) || 0;
    pt.bandwidthFee = String(bandwidthFee);
    pt.bandwidthUsage =
      Number(receipt.net_usage ?? receipt.bandwidth_usage ?? 0) || 0;
    pt.transferAt = transferAt;
    const contractAddrRaw = (info as any).contract_address;
    if (contractAddrRaw) {
      const contractAddrStr = String(contractAddrRaw);
      // TronGrid 常返回 41 开头的 hex（长度 42）；表字段通常存 base58（长度 34）
      pt.contractAddr =
        contractAddrStr.length === 42 && contractAddrStr.startsWith("41")
          ? TronHelper.hexString2Address(contractAddrStr)
          : contractAddrStr;
    } else {
      pt.contractAddr = null;
    }
    pt.status = 10; // 对标 PHP: status = 10
    pt.updatedAt = Math.floor(Date.now() / 1000);

    await repo.save(pt);
  }
}
