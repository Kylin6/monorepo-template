import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker } from "bullmq";
import { MANUAL_RECLAIM, RECLAIM_QUEUE_KEY, LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY } from "@common/index";
import {
  getDataSource,
  getLeaseRecordsRepository,
  getAuthorizedWalletRepository,
  getEnergyRecordsRepository,
  LeasePlan,
} from "@database/index";
import { LEASE_RECORDS_STATUS } from "@database/constants/lease-records";
import {
  LEASE_PLAN_STATUS,
  LEASE_POOL_STATUS,
} from "@database/constants/lease-plan";
import {
  TronResourceService,
  TronResourceType,
} from "../../services/tron-resource";
import { RemarkUtils } from "@common/index";
import { In } from "typeorm";
import {
  ENERGY_RECORDS_STATUS,
  SYSTEM_ORDER_ID,
} from "@database/constants/energy-records";
import { getQueueConnection } from "@queue/index";

interface ReclaimJobPayload {
  orderId: number;
  usedCount?: number;
}

interface ManualReclaimPayload {
  from: string;
  to: string;
  type: "E" | "B";
  /** 回收数量（单位：sun，与 PHP 保持一致） */
  amount: number;
}

interface PlanReclaimJobPayload {
  planId: number;
  type: "E" | "B";
}

@Injectable()
export class UndelegationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UndelegationProcessor.name);
  private reclaimWorker: Worker<ReclaimJobPayload> | null = null;
  private manualWorker: Worker<ManualReclaimPayload> | null = null;
  private planReclaimWorker: Worker<PlanReclaimJobPayload> | null = null;

  constructor(private readonly tronResource: TronResourceService) {}

  async onModuleInit() {
    const connection = getQueueConnection();

    this.reclaimWorker = new Worker<ReclaimJobPayload>(
      RECLAIM_QUEUE_KEY,
      async (job) => {
        const { orderId } = job.data;
        if (!orderId) return;
        await this.handleReclaim(orderId, job.data.usedCount);
      },
      { connection }
    );

    this.reclaimWorker.on("completed", (job) => {
      this.logger.log(
        `订单回收成功: orderId=${job.data.orderId} jobId=${job.id}`
      );
    });
    this.reclaimWorker.on("failed", (job, err) => {
      this.logger.error(
        `订单回收失败: orderId=${job?.data?.orderId} jobId=${job?.id}`,
        err
      );
    });
    this.logger.log(`订单回收服务启动: ${RECLAIM_QUEUE_KEY}`);

    // 对标 PHP subscribe('manual:reclaim', ...) —— 使用安全队列名 manual_reclaim
    this.manualWorker = new Worker<ManualReclaimPayload>(
      MANUAL_RECLAIM,
      async (job) => {
        await this.handleManualReclaim(job.data);
      },
      { connection }
    );
    this.manualWorker.on("completed", (job) => {
      this.logger.log(`手动回收成功 jobId=${job.id}`);
    });
    this.manualWorker.on("failed", (job, err) => {
      this.logger.error(`手动回收失败 jobId=${job?.id}`, err);
    });

    // 托管2套餐回收池子队列
    this.planReclaimWorker = new Worker<PlanReclaimJobPayload>(
      LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY,
      async (job) => {
        const { planId, type } = job.data;
        if (!planId || (type !== "E" && type !== "B")) return;
        await this.handlePlanReclaim(planId, type);
      },
      { connection }
    );
    this.planReclaimWorker.on("completed", (job) => {
      this.logger.log(`托管2套餐回收成功 jobId=${job.id}`);
    });
    this.planReclaimWorker.on("failed", (job, err) => {
      this.logger.error(`托管2套餐回收失败 jobId=${job?.id}`, err);
    });
  }

  async onModuleDestroy() {
    if (this.reclaimWorker) {
      await this.reclaimWorker.close();
      this.reclaimWorker = null;
    }
    if (this.manualWorker) {
      await this.manualWorker.close();
      this.manualWorker = null;
    }
    if (this.planReclaimWorker) {
      await this.planReclaimWorker.close();
      this.planReclaimWorker = null;
    }
  }

  private async handleReclaim(orderId: number, _usedCount?: number) {
    console.log("回收 orderId", orderId, "usedCount", _usedCount);
    const leaseRepo = await getLeaseRecordsRepository();

    const record = await leaseRepo.findOne({
      where: {
        orderId,
        status: In([
          LEASE_RECORDS_STATUS.DELEGATED,
          LEASE_RECORDS_STATUS.RECLAIM_FAILED,
          LEASE_RECORDS_STATUS.RECLAIM_UNKNOWN,
        ]),
      },
    });
    if (!record) return;

    const fromAddr = record.fromAddr ?? "";
    const toAddr = record.toAddr ?? "";
    if (!fromAddr || !toAddr) {
      record.status = LEASE_RECORDS_STATUS.RECLAIM_FAILED;
      record.remark = RemarkUtils.addRemark(
        record.remark,
        "回收失败: fromAddr 或 toAddr 为空"
      );
      await leaseRepo.save(record);
      return;
    }

    const walletRepo = await getAuthorizedWalletRepository();
    const fromWallet = await walletRepo.findOne({ where: { addr: fromAddr } });
    if (!fromWallet) {
      record.status = LEASE_RECORDS_STATUS.RECLAIM_FAILED;
      record.remark = RemarkUtils.addRemark(
        record.remark,
        "回收失败: 未找到 fromAddr 对应钱包"
      );
      await leaseRepo.save(record);
      return;
    }

    const stakeAmount = Number(record.stakeAmount ?? 0);
    if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
      record.status = LEASE_RECORDS_STATUS.RECLAIM_FAILED;
      record.remark = RemarkUtils.addRemark(
        record.remark,
        "回收失败: stakeAmount 无效"
      );
      await leaseRepo.save(record);
      return;
    }

    const resource: TronResourceType =
      record.type === "B" ? "BANDWIDTH" : "ENERGY";
    const amountSun = TronResourceService.trxToSun(stakeAmount);

    let txId: string;
    try {
      txId = await this.tronResource.undelegateResource({
        ownerAddress: fromAddr,
        receiverAddress: toAddr,
        resource,
        amountSun,
        permissionId: fromWallet.permissionId ?? undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      record.status = LEASE_RECORDS_STATUS.RECLAIM_FAILED;
      record.remark = RemarkUtils.addRemark(
        record.remark,
        `回收请求失败: ${msg}`
      );
      await leaseRepo.save(record);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    record.reclaimTxId = txId;
    record.status = LEASE_RECORDS_STATUS.WAITING_RECLAIMED;
    record.reclaimedAt = now;
    await leaseRepo.save(record);
  }

  private async handleManualReclaim(payload: ManualReclaimPayload) {
    const from = payload?.from ?? "";
    const to = payload?.to ?? "";
    const type = payload?.type;
    const amountSun = Math.abs(Number(payload?.amount ?? 0));
    if (!from || !to || (type !== "E" && type !== "B") || amountSun <= 0) {
      throw new Error("manual_reclaim 参数不完整");
    }

    const walletRepo = await getAuthorizedWalletRepository();
    const wallet = await walletRepo.findOne({ where: { addr: from } });
    if (!wallet) throw new Error(`manual_reclaim 未找到钱包: ${from}`);

    const resource: TronResourceType = type === "B" ? "BANDWIDTH" : "ENERGY";
    const txId = await this.tronResource.undelegateResource({
      ownerAddress: from,
      receiverAddress: to,
      resource,
      amountSun,
      permissionId: wallet.permissionId ?? undefined,
    });

    setTimeout(() => {
      this.markManualEnergyRecord(txId).catch(() => undefined);
    }, 15_000);
  }

  private async markManualEnergyRecord(txId: string) {
    const energyRepo = await getEnergyRecordsRepository();
    const row = await energyRepo.findOne({ where: { txId } });
    if (!row) return;
    row.orderId = SYSTEM_ORDER_ID;
    row.status = ENERGY_RECORDS_STATUS.SUCCESS;
    row.finishedAt = Math.floor(Date.now() / 1000);
    await energyRepo.save(row);
  }

  private async handlePlanReclaim(planId: number, type: "E" | "B") {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const plan = await planRepo.findOne({ where: { planId } });
    if (!plan) return;

    // 仅在计划已关闭时允许回收池子
    if (plan.status !== LEASE_PLAN_STATUS.INACTIVE) return;
    if (!plan.toAddr) return;

    const isEnergy = type === "E";

    // 校验 pool 状态
    if (isEnergy) {
      if (plan.energyPoolStatus !== LEASE_POOL_STATUS.DELEGATED) return;
    } else {
      if (plan.netPoolStatus !== LEASE_POOL_STATUS.DELEGATED) return;
    }

    // 根据 type 取池子地址与质押数量（单位：TRX）
    const fromAddr = (isEnergy ? plan.energyPoolAddr : plan.netPoolAddr) ?? "";
    const stakeAmountTrxRaw = isEnergy
      ? plan.energyStakeAmount
      : plan.netStakeAmount;
    const stakeAmountTrx = Number(stakeAmountTrxRaw ?? 0);
    if (!fromAddr) return;
    if (!Number.isFinite(stakeAmountTrx) || stakeAmountTrx <= 0) return;

    const walletRepo = await getAuthorizedWalletRepository();
    const fromWallet = await walletRepo.findOne({ where: { addr: fromAddr } });
    if (!fromWallet) return;

    const resource: TronResourceType = isEnergy ? "ENERGY" : "BANDWIDTH";
    const amountSun = TronResourceService.trxToSun(stakeAmountTrx);

    let txId: string;
    try {
      txId = await this.tronResource.undelegateResource({
        ownerAddress: fromAddr,
        receiverAddress: plan.toAddr,
        resource,
        amountSun,
        permissionId: fromWallet.permissionId ?? undefined,
      });
    } catch (e) {
      this.logger.warn(
        `回收托管池失败 planId=${plan.planId} type=${type}: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (isEnergy) {
      plan.energyReclaimTxId = txId;
      plan.energyPoolStatus = LEASE_POOL_STATUS.WAITING_RECLAIMED;
    } else {
      plan.netReclaimTxId = txId;
      plan.netPoolStatus = LEASE_POOL_STATUS.WAITING_RECLAIMED;
    }
    plan.lastCheckAt = now;
    await planRepo.save(plan);
  }
}
