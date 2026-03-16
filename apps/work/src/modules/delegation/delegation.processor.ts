import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker } from "bullmq";
import { DELEGATE_QUEUE_KEY } from "@common/index";
import {
  getDataSource,
  getLeaseRecordsRepository,
  getAuthorizedWalletRepository,
  getSysCfgRepository,
  getUserRepository,
  LeasePlan,
} from "@database/index";
import { LEASE_RECORDS_STATUS } from "@database/constants/lease-records";
import {
  LEASE_PLAN_CATE,
  LEASE_PLAN_STATUS,
  LEASE_POOL_STATUS,
} from "@database/constants/lease-plan";
import {
  TronResourceService,
  TronResourceType,
} from "../../services/tron-resource";
import { In } from "typeorm";
import {
  LeaseRecords as LeaseRecordsModel,
  type LeaseExpireType,
} from "@database/entities/models/LeaseRecords";
import { getQueueConnection, sendQueueJob } from "@queue/index";
import { LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY, TELEGRAM_DURATION_ORDER_NOTIFY } from "@common/index";

interface DelegateJobPayload {
  orderId: number;
}

interface Plan2DelegateJobPayload {
  planId: number;
  type: "E" | "B";
}

@Injectable()
export class DelegationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DelegationProcessor.name);
  private delegateWorker: Worker<DelegateJobPayload> | null = null;
  private plan2DelegateWorker: Worker<Plan2DelegateJobPayload> | null = null;
  constructor(private readonly tronResource: TronResourceService) {}

  async onModuleInit() {
    const connection = getQueueConnection();

    this.delegateWorker = new Worker<DelegateJobPayload>(
      DELEGATE_QUEUE_KEY,
      async (job) => {
        const { orderId } = job.data;
        if (!orderId) throw new Error("orderId 不能为空");
        await this.handleDelegate(orderId);
      },
      { connection }
    );

    this.delegateWorker.on("completed", (job) => {
      this.logger.log(
        `代理能量派发成功 orderId=${job.data.orderId} jobId=${job.id}`
      );
    });
    this.delegateWorker.on("failed", (job, err) => {
      this.logger.error(
        `代理能量派发失败 orderId=${job?.data?.orderId} jobId=${job?.id}`,
        err
      );
    });

    // 托管2套餐代理池子队列
    this.plan2DelegateWorker = new Worker<Plan2DelegateJobPayload>(
      LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY,
      async (job) => {
        const { planId, type } = job.data;
        if (!planId || (type !== "E" && type !== "B")) return;
        await this.handlePlan2Delegate(planId, type);
      },
      { connection }
    );
    this.plan2DelegateWorker.on("completed", (job) => {
      this.logger.log(`托管2套餐代理成功 jobId=${job.id}`);
    });
    this.plan2DelegateWorker.on("failed", (job, err) => {
      this.logger.error(`托管2套餐代理失败 jobId=${job?.id}`, err);
    });



    this.logger.log(`订单处理服务启动: ${DELEGATE_QUEUE_KEY}`);
  }

  async onModuleDestroy() {
    if (this.delegateWorker) {
      await this.delegateWorker.close();
      this.delegateWorker = null;
    }
  }

  /** 处理单个订单的资源委托（对标 PHP Delegation subscribe） */
  private async handleDelegate(orderId: number): Promise<void> {
    const leaseRepo = await getLeaseRecordsRepository();
    const userRepo = await getUserRepository();

    const record = await leaseRepo.findOne({
      where: {
        orderId,
        status: In([LEASE_RECORDS_STATUS.PAYED, LEASE_RECORDS_STATUS.UNKNOWN]),
      },
    });
    if (!record) return;

    record.tryCounts = (record.tryCounts ?? 0) + 1;

    const wallet = await LeaseRecordsModel.checkFromAddr(record);
    if (!wallet) {
      await leaseRepo.save(record);
      this.logger.warn(`order ${orderId} 未找到合适的钱包`);
      return;
    }

    const stakeRate = await this.getStakeExchange(record.type);
    const amount = Number(record.amount ?? 0);
    if (!stakeRate || !Number.isFinite(stakeRate) || amount <= 0) {
      this.logger.error(
        `order ${orderId} 计算质押数量失败, stakeRate=${stakeRate}, amount=${amount}`
      );
      await leaseRepo.save(record);
      return;
    }

    const stakeAmountTrx = Math.ceil(amount / stakeRate);
    const expireSeconds = LeaseRecordsModel.calculateExpire(
      record.expire,
      record.expireType as LeaseExpireType
    );

    const cost = Number(record.cost ?? 0);
    // const lock = cost > 0 && wallet.lock === 10;
    const lock = false;
    const lockPeriod = lock ? Math.floor(expireSeconds / 3) : undefined;

    const resource: TronResourceType =
      record.type === "B" ? "BANDWIDTH" : "ENERGY";

    const txId = await this.tronResource.delegateResource({
      receiverAddress: record.toAddr ?? "",
      resource,
      amountSun: TronResourceService.trxToSun(stakeAmountTrx),
      lock,
      lockPeriod,
      ownerAddress: wallet.addr,
      permissionId: wallet.permissionId ?? undefined,
    });

    // 更新钱包资源余额（能量/带宽）
    const walletRepo = await getAuthorizedWalletRepository();
    if (record.type === "E") {
      const current = wallet.energy ?? 0;
      wallet.energy = current - amount;
    } else {
      const current = wallet.bandwidth ?? 0;
      wallet.bandwidth = current - amount;
    }
    await walletRepo.save(wallet);

    // 更新订单信息
    record.txId = txId;
    record.sellerId = wallet.id;
    record.fromAddr = wallet.addr;
    record.locked = wallet.lock;
    record.platform = wallet.type;
    record.stakeAmount = String(stakeAmountTrx);
    record.stakeRate = String(stakeRate);
    record.status = LEASE_RECORDS_STATUS.BROADCASTED;

    await leaseRepo.save(record);

    // 查看订单用户是否有 telegramId，如果有则发送通知到 Telegram 队列
    const user = await userRepo.findOne({ where: { id: record.uid } });
    if (user?.telegramId) {
      await sendQueueJob(TELEGRAM_DURATION_ORDER_NOTIFY, {
        telegramId: user.telegramId,
        orderId: record.orderId,
        amount: String(amount),
        toAddr: record.toAddr ?? "",
        type: record.type,
        totalCost: Number(record.totalCost ?? 0),
        balance: Number(user.balance ?? 0),
      });
    }
  }

  private async getStakeExchange(type: "E" | "B"): Promise<number> {
    const sysRepo = await getSysCfgRepository();
    const key = type === "E" ? "energyStakeExchange" : "bandwidthStakeExchange";
    const cfg = await sysRepo.findOne({ where: { key } });
    if (!cfg) {
      this.logger.error(`未找到 SysCfg 配置: key=${key}`);
      return NaN;
    }
    const value = Number(cfg.value);
    return Number.isFinite(value) ? value : NaN;
  }

  /** 处理托管2套餐的资源委托 */
  private async handlePlan2Delegate(
    planId: number,
    type: "E" | "B"
  ): Promise<void> {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const plan = await planRepo.findOne({ where: { planId } });
    if (!plan) return;

    // 仅处理托管2且处于开启状态的计划
    if (plan.cate !== LEASE_PLAN_CATE.PLAN2) return;
    if (plan.status !== LEASE_PLAN_STATUS.ACTIVE) return;

    const isEnergy = type === "E";
    if (!plan.toAddr) return;

    // 校验池子状态：只在 INIT 时派发
    if (isEnergy) {
      if (plan.energyPoolStatus !== LEASE_POOL_STATUS.INIT) return;
    } else {
      if (plan.netPoolStatus !== LEASE_POOL_STATUS.INIT) return;
    }

    const poolAddr = (isEnergy ? plan.energyPoolAddr : plan.netPoolAddr) ?? "";
    const poolAmount = Number(
      isEnergy ? (plan.energyPoolAmount ?? 0) : (plan.netPoolAmount ?? 0),
    );
    if (!poolAddr) return;
    if (!Number.isFinite(poolAmount) || poolAmount <= 0) return;

    const stakeRate = await this.getStakeExchange(type);
    if (!stakeRate || !Number.isFinite(stakeRate) || stakeRate <= 0) return;

    // 质押 TRX 数量：ceil(资源数量 / 汇率)
    const stakeAmountTrx = Math.ceil(poolAmount / stakeRate);
    if (!Number.isFinite(stakeAmountTrx) || stakeAmountTrx <= 0) return;

    const walletRepo = await getAuthorizedWalletRepository();
    const wallet = await walletRepo.findOne({ where: { addr: poolAddr } });
    if (!wallet) return;
    if (wallet.permissionId == null) {
      this.logger.warn(
        `plan2 pool wallet missing permissionId addr=${poolAddr} planId=${planId} type=${type}`,
      );
      return;
    }

    const resource: TronResourceType = isEnergy ? "ENERGY" : "BANDWIDTH";
    const txId = await this.tronResource.delegateResource({
      receiverAddress: plan.toAddr,
      resource,
      amountSun: TronResourceService.trxToSun(stakeAmountTrx),
      lock: false,
      ownerAddress: poolAddr,
      permissionId: wallet.permissionId ?? undefined,
    });

    // 更新钱包资源余额（能量/带宽）
    if (isEnergy) {
      wallet.energy = (wallet.energy ?? 0) - poolAmount;
    } else {
      wallet.bandwidth = (wallet.bandwidth ?? 0) - poolAmount;
    }
    await walletRepo.save(wallet);

    // 写回计划池子委托信息
    const now = Math.floor(Date.now() / 1000);
    if (isEnergy) {
      plan.energyTxId = txId;
      plan.energyStakeAmount = String(stakeAmountTrx);
      plan.energyPoolStatus = LEASE_POOL_STATUS.WAITING_DELEGATED;
    } else {
      plan.netTxId = txId;
      plan.netStakeAmount = String(stakeAmountTrx);
      plan.netPoolStatus = LEASE_POOL_STATUS.WAITING_DELEGATED;
    }
    plan.lastCheckAt = now;
    await planRepo.save(plan);
  }
}
