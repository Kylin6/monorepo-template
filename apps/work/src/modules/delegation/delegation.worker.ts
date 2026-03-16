import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Queue } from "bullmq";
import {
  DELEGATE_QUEUE_KEY,
  RECLAIM_QUEUE_KEY,
  LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY,
} from "@common/index";
import {
  getDataSource,
  getLeaseRecordsRepository,
  getEnergyRecordsRepository,
  LeasePlan,
} from "@database/index";
import { LEASE_RECORDS_STATUS } from "@database/constants/lease-records";
import { ENERGY_RECORDS_STATUS } from "@database/constants/energy-records";
import { In, LessThan } from "typeorm";
import {
  LeaseRecords as LeaseRecordsModel,
  type LeaseExpireType,
} from "@database/entities/models/LeaseRecords";
import { getQueueConnection, sendQueueJob } from "@queue/index";
import {
  LEASE_PLAN_CATE,
  LEASE_PLAN_STATUS,
  LEASE_POOL_STATUS,
} from "@database/constants/lease-plan";

@Injectable()
export class DelegationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DelegationWorker.name);

  private delegateQueue!: Queue;
  private reclaimQueue!: Queue;

  private timers: NodeJS.Timeout[] = [];

  async onModuleInit() {
    const connection = getQueueConnection();

    this.delegateQueue = new Queue(DELEGATE_QUEUE_KEY, { connection });
    this.reclaimQueue = new Queue(RECLAIM_QUEUE_KEY, { connection });

    // 对标 PHP Delegation Timer::add(5, ...) 扫描已支付订单
    this.timers.push(
      setInterval(() => {
        this.scanPayedOrders().catch((err) =>
          this.logger.error("scanPayedOrders error", err)
        );
      }, 5_000)
    );

    // 对标 PHP Delegation Timer::add(15, ...) 检查异常订单
    this.timers.push(
      setInterval(() => {
        this.scanAbnormalOrders().catch((err) =>
          this.logger.error("scanAbnormalOrders error", err)
        );
      }, 15_000)
    );

    // 对标 PHP Delegation Timer::add(3, ...) 检查订单是否已在链上完成代理
    this.timers.push(
      setInterval(() => {
        this.scanDelegatedEnergy().catch((err) =>
          this.logger.error("scanDelegatedEnergy error", err)
        );
      }, 3_000)
    );

    // 检查托管2套餐池子是否已完成链上代理
    this.timers.push(
      setInterval(() => {
        this.scanPlan2DelegatePool().catch((err) =>
          this.logger.error("scanPlan2DelegatePool error", err)
        );
      }, 3_000)
    );
    // 检查异常托管2套餐池子
    this.timers.push(
      setInterval(() => {
        this.scanPlan2AbnormalPool().catch((err) =>
          this.logger.error("scanPlan2AbnormalPool error", err)
        );
      }, 15_000)
    );

    this.logger.log("DelegationWorker timers started");
  }

  async onModuleDestroy() {
    for (const t of this.timers) {
      clearInterval(t);
    }
    this.timers = [];

    await Promise.allSettled([
      this.delegateQueue?.close(),
      this.reclaimQueue?.close(),
    ]);
  }

  /** 扫描已支付-待处理订单，推入委托队列 */
  private async scanPayedOrders() {
    const now = Math.floor(Date.now() / 1000);
    const leaseRepo = await getLeaseRecordsRepository();

    const records = await leaseRepo.find({
      where: {
        status: LEASE_RECORDS_STATUS.PAYED,
        createdAt: LessThan(now - 10),
      },
    });

    if (!records.length) {
      return;
    }

    this.logger.log(`scanPayedOrders found ${records.length} records`);

    for (const record of records) {
      await this.delegateQueue.add("default", { orderId: record.orderId });
    }
  }

  /** 检查异常代理订单，按状态重新推入委托/回收队列 */
  private async scanAbnormalOrders() {
    const now = Math.floor(Date.now() / 1000);
    const leaseRepo = await getLeaseRecordsRepository();

    const records = await leaseRepo.find({
      where: {
        status: In([
          LEASE_RECORDS_STATUS.BROADCASTED,
          LEASE_RECORDS_STATUS.UNKNOWN,
          LEASE_RECORDS_STATUS.RECLAIM_UNKNOWN,
          LEASE_RECORDS_STATUS.RECLAIM_FAILED,
        ]),
        createdAt: LessThan(now - 60),
      },
    });

    if (!records.length) {
      return;
    }

    this.logger.log(`scanAbnormalOrders found ${records.length} records`);

    for (const record of records) {
      if (
        record.status === LEASE_RECORDS_STATUS.RECLAIM_UNKNOWN ||
        record.status === LEASE_RECORDS_STATUS.RECLAIM_FAILED
      ) {
        await this.reclaimQueue.add("default", { orderId: record.orderId });
      }
      if (record.status === LEASE_RECORDS_STATUS.UNKNOWN) {
        await this.delegateQueue.add("default", { orderId: record.orderId });
      }
    }
  }

  /** 检查订单是否已在链上完成代理：匹配 energy_records，更新订单与能量记录状态 */
  private async scanDelegatedEnergy() {
    const leaseRepo = await getLeaseRecordsRepository();
    const energyRepo = await getEnergyRecordsRepository();

    const leaseRecords = await leaseRepo.find({
      where: {
        status: In([
          LEASE_RECORDS_STATUS.BROADCASTED,
          LEASE_RECORDS_STATUS.PAYED,
          LEASE_RECORDS_STATUS.UNKNOWN,
        ]),
      },
    });

    if (!leaseRecords.length) {
      return;
    }

    const txIds = leaseRecords
      .map((r) => r.txId)
      .filter((txId): txId is string => !!txId);

    if (!txIds.length) {
      return;
    }

    const energyRecords = await energyRepo.find({
      where: {
        status: ENERGY_RECORDS_STATUS.PENDING,
        txId: In(txIds),
      },
    });

    if (!energyRecords.length) {
      return;
    }

    const energyByTx = new Map(
      energyRecords.filter((e) => !!e.txId).map((e) => [e.txId as string, e])
    );

    const now = Math.floor(Date.now() / 1000);
    const updatedLease: typeof leaseRecords = [];
    const updatedEnergy: typeof energyRecords = [];

    for (const record of leaseRecords) {
      if (!record.txId) continue;
      const energy = energyByTx.get(record.txId);
      if (!energy) continue;

      const expireSeconds = LeaseRecordsModel.calculateExpire(
        record.expire,
        record.expireType as LeaseExpireType
      );

      record.startAt = energy.timestamp;
      record.expiredAt = energy.timestamp + expireSeconds;
      record.status = LEASE_RECORDS_STATUS.DELEGATED;

      energy.orderId = record.orderId;
      energy.status = ENERGY_RECORDS_STATUS.SUCCESS;
      energy.finishedAt = now;

      updatedLease.push(record);
      updatedEnergy.push(energy);
    }

    if (updatedLease.length) {
      await leaseRepo.save(updatedLease);
    }
    if (updatedEnergy.length) {
      await energyRepo.save(updatedEnergy);
    }

    if (updatedLease.length || updatedEnergy.length) {
      this.logger.log(
        `scanDelegatedEnergy  updated lease=${updatedLease.length}, energy=${updatedEnergy.length}`
      );
    }
  }

  /** 检查托管2套餐池子是否已完成链上代理 */
  private async scanPlan2DelegatePool() {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const energyRepo = await getEnergyRecordsRepository();

    const plans = await planRepo.find({
      where: {
        cate: LEASE_PLAN_CATE.PLAN2,
        status: LEASE_PLAN_STATUS.ACTIVE,
      } as any,
    });
    if (!plans.length) return;

    const candidates = plans.filter(
      (p) =>
        p.energyPoolStatus === LEASE_POOL_STATUS.WAITING_DELEGATED ||
        p.netPoolStatus === LEASE_POOL_STATUS.WAITING_DELEGATED
    );
    if (!candidates.length) return;

    const now = Math.floor(Date.now() / 1000);

    for (const plan of candidates) {
      let changed = false;

      // 能量池委托确认
      if (
        plan.energyPoolStatus === LEASE_POOL_STATUS.WAITING_DELEGATED &&
        plan.energyTxId
      ) {
        const energy = await energyRepo.findOne({
          where: {
            txId: plan.energyTxId,
            status: ENERGY_RECORDS_STATUS.PENDING,
          },
        });
        if (energy) {
          energy.planId = plan.planId;
          energy.status = ENERGY_RECORDS_STATUS.SUCCESS;
          energy.finishedAt = now;
          await energyRepo.save(energy);

          plan.energyPoolStatus = LEASE_POOL_STATUS.DELEGATED;
          plan.energyDelegateAt = energy.timestamp;
          changed = true;
        }
      }

      // 带宽池委托确认（同样使用 energy_records 记录 tx）
      if (
        plan.netPoolStatus === LEASE_POOL_STATUS.WAITING_DELEGATED &&
        plan.netTxId
      ) {
        const energy = await energyRepo.findOne({
          where: {
            txId: plan.netTxId,
            status: ENERGY_RECORDS_STATUS.PENDING,
          },
        });
        if (energy) {
          energy.planId = plan.planId;
          energy.status = ENERGY_RECORDS_STATUS.SUCCESS;
          energy.finishedAt = now;
          await energyRepo.save(energy);

          plan.netPoolStatus = LEASE_POOL_STATUS.DELEGATED;
          plan.netDelegateAt = energy.timestamp;
          changed = true;
        }
      }

      if (changed) {
        plan.lastCheckAt = now;
        await planRepo.save(plan);
      }
    }
  }

  /**
   * 检查异常托管2套餐池子
   * - pool_status = WAITING_DELEGATED 且超过更新时间 60 秒仍未完成链上确认
   * - 重新投递到 LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY 触发再次派发
   */
  private async scanPlan2AbnormalPool() {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const energyRepo = await getEnergyRecordsRepository();

    const plans = await planRepo.find({
      where: { cate: LEASE_PLAN_CATE.PLAN2, status: LEASE_PLAN_STATUS.ACTIVE } as any,
    });
    if (!plans.length) return;

    const now = Math.floor(Date.now() / 1000);
    const overdueSeconds = 60;

    for (const plan of plans) {
      // 以更新时间为准：超过 60 秒仍未代理成功才重投
      const updatedAt = Number(plan.updatedAt ?? 0) || 0;
      if (updatedAt && now - updatedAt < overdueSeconds) continue;

      let needSave = false;
      let shouldTouchUpdatedAt = false;

      // 能量池异常
      if (plan.energyPoolStatus === LEASE_POOL_STATUS.WAITING_DELEGATED) {
        const txId = plan.energyTxId ?? "";
        if (!txId) {
          await sendQueueJob(LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY, {
            planId: plan.planId,
            type: "E",
          });
          shouldTouchUpdatedAt = true;
          needSave = true;
        } else {
          const exists = await energyRepo.exist({
            where: { txId, status: In([ENERGY_RECORDS_STATUS.PENDING, ENERGY_RECORDS_STATUS.SUCCESS]) } as any,
          });
          if (!exists) {
            await sendQueueJob(LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY, {
              planId: plan.planId,
              type: "E",
            });
            shouldTouchUpdatedAt = true;
            needSave = true;
          }
        }
      }

      // 带宽池异常
      if (plan.withBandwidth && plan.netPoolStatus === LEASE_POOL_STATUS.WAITING_DELEGATED) {
        const txId = plan.netTxId ?? "";
        if (!txId) {
          await sendQueueJob(LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY, {
            planId: plan.planId,
            type: "B",
          });
          shouldTouchUpdatedAt = true;
          needSave = true;
        } else {
          const exists = await energyRepo.exist({
            where: {
              txId,
              status: In([
                ENERGY_RECORDS_STATUS.PENDING,
                ENERGY_RECORDS_STATUS.SUCCESS,
              ]),
            } as any,
          });
          if (!exists) {
            await sendQueueJob(LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY, {
              planId: plan.planId,
              type: "B",
            });
            shouldTouchUpdatedAt = true;
            needSave = true;
          }
        }
      }

      if (needSave) {
        if (shouldTouchUpdatedAt) {
          plan.updatedAt = now;
        }
        await planRepo.save(plan);
      }
    }
  }
}
