import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { RECLAIM_QUEUE_KEY } from "@database/constants/lease-records";
import { LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY } from "@common/index";
import {
  getLeaseRecordsRepository,
  getEnergyRecordsRepository,
  Funds,
  UniqueId,
  User,
} from "@database/index";
import {
  LEASE_RECORDS_STATUS,
  LEASE_RECORDS_RECLAIM_TYPE,
  LEASE_RECORDS_SOURCE,
} from "@database/constants/lease-records";
import { ENERGY_RECORDS_STATUS } from "@database/constants/energy-records";
import { FUNDS_CATE, FUNDS_TYPE } from "@database/constants/funds";
import { In, LessThanOrEqual } from "typeorm";
import { TronResourceService } from "../../services/tron-resource";
import { getSysCfgRepository, getDataSource } from "@database/index";
import { getSetting } from "@database/helper/sys-cfg.helper";
import { RemarkUtils } from "@common/index";
import { LeasePlan } from "@database/index";
import {
  LEASE_PLAN_CATE,
  LEASE_PLAN_STATUS,
  LEASE_POOL_STATUS,
} from "@database/constants/lease-plan";
import { getQueueConnection } from "@queue/index";

/**
 * 对标 PHP UnDelegation::run 的定时任务：
 * 1. 每 3 秒检查「待回收」订单是否已在链上完成回收（energy_records 是否已有 reclaimTxId 记录）
 * 2. 每 5 秒扫描已到期且状态为「已代理」的订单，推入回收队列
 * 3. 每 3 秒检查提前回收（Crontab + getaccountresource + checkEnergyReclaim/checkBandwidthReclaim）
 */
@Injectable()
export class UndelegationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UndelegationWorker.name);

  private reclaimQueue!: Queue;
  private plan2ReclaimQueue!: Queue;
  private timers: NodeJS.Timeout[] = [];
  private earlyRunning = false;

  constructor(private readonly tronResource: TronResourceService) {}

  async onModuleInit() {
    const connection = getQueueConnection();

    this.reclaimQueue = new Queue(RECLAIM_QUEUE_KEY, { connection });
    this.plan2ReclaimQueue = new Queue(LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY, {
      connection,
    });

    // 处理已回收的能量
    this.timers.push(
      setInterval(() => {
        this.scanReclaimedEnergy().catch((err) =>
          this.logger.error("scanReclaimedEnergy error", err)
        );
      }, 3_000)
    );

    // 处理已到期的已代理订单
    this.timers.push(
      setInterval(() => {
        this.scanExpiredDelegated().catch((err) =>
          this.logger.error("scanExpiredDelegated error", err)
        );
      }, 5_000)
    );

    // 托管2套餐回收池子队列
    this.timers.push(
      setInterval(() => {
        this.scanPlanReclaim().catch((err) =>
          this.logger.error("scanPlanReclaim error", err)
        );
      }, 3_000)
    );
    // 处理托管2套餐已关闭未回收的池子
    this.timers.push(
      setInterval(() => {
        this.scanColsePlanDelegated().catch((err) =>
          this.logger.error("scanColsePlanDelegated error", err),
        );
      }, 5_000)
    );
    this.logger.log("回收处理服务启动");
  }

  async onModuleDestroy() {
    for (const t of this.timers) {
      clearInterval(t);
    }
    this.timers = [];
    await this.reclaimQueue?.close().catch(() => undefined);
    await this.plan2ReclaimQueue?.close().catch(() => undefined);
  }

  /**
   * 对标 PHP UnDelegation Timer 3s：检查 status=WAITING_RECLAIMED 的订单，
   * 若 energy_records 中已有对应 reclaimTxId 且 status=PENDING，则更新为已回收完成。
   */
  private async scanReclaimedEnergy() {
    const leaseRepo = await getLeaseRecordsRepository();
    const energyRepo = await getEnergyRecordsRepository();

    const records = await leaseRepo.find({
      where: { status: LEASE_RECORDS_STATUS.WAITING_RECLAIMED },
    });

    if (!records.length) return;

    const reclaimTxIds = records
      .map((r) => r.reclaimTxId)
      .filter((id): id is string => !!id);
    if (!reclaimTxIds.length) return;

    const energyRecords = await energyRepo.find({
      where: {
        txId: In(reclaimTxIds),
        status: ENERGY_RECORDS_STATUS.PENDING,
      },
    });

    if (!energyRecords.length) return;

    const energyByTx = new Map(
      energyRecords.filter((e) => !!e.txId).map((e) => [e.txId as string, e])
    );

    const now = Math.floor(Date.now() / 1000);
    const toSaveLease: typeof records = [];
    const toSaveEnergy: typeof energyRecords = [];

    for (const record of records) {
      if (!record.reclaimTxId) continue;
      const energy = energyByTx.get(record.reclaimTxId);
      if (!energy) continue;

      energy.orderId = record.orderId;
      energy.status = ENERGY_RECORDS_STATUS.SUCCESS;
      energy.finishedAt = now;

      record.reclaimType = LEASE_RECORDS_RECLAIM_TYPE.SYSTEM;
      record.status = LEASE_RECORDS_STATUS.FINISHED;

      toSaveLease.push(record);
      toSaveEnergy.push(energy);
    }

    if (toSaveLease.length) await leaseRepo.save(toSaveLease);
    if (toSaveEnergy.length) await energyRepo.save(toSaveEnergy);

    if (toSaveLease.length) {
      this.logger.log(
        `scanReclaimedEnergy updated lease=${toSaveLease.length}, energy=${toSaveEnergy.length}`
      );
    }
  }

  /**
   * 对标 PHP UnDelegation「回收到期能量」Timer 5s：
   * 扫描 status=DELEGATED 且 expiredAt <= 当前时间 的订单，推入回收队列。
   */
  private async scanExpiredDelegated() {
    const now = Math.floor(Date.now() / 1000);
    const leaseRepo = await getLeaseRecordsRepository();

    const records = await leaseRepo.find({
      where: {
        status: LEASE_RECORDS_STATUS.DELEGATED,
        expiredAt: LessThanOrEqual(now),
      },
    });

    if (!records.length) return;

    this.logger.log(`scanExpiredDelegated found ${records.length} records`);

    for (const record of records) {
      await this.reclaimQueue.add("default", { orderId: record.orderId });
    }
  }

  /** 对标 PHP 提前回收 Crontab：遍历进行中的订单，按资源剩余决定是否回收 */
  @Cron("2-59/3 * * * * *")
  async scanEarlyReclaim() {
    if (this.earlyRunning) return;
    this.earlyRunning = true;
    try {
      const now = Math.floor(Date.now() / 1000);
      const leaseRepo = await getLeaseRecordsRepository();
      const sysRepo = await getSysCfgRepository();

      const earlyRecoveryTimeMin = Number(
        await getSetting(sysRepo, "earlyRecoveryTime").catch(() => "0")
      );

      const orders = await leaseRepo.find({
        where: { status: LEASE_RECORDS_STATUS.DELEGATED },
        order: { planId: "DESC" as any },
      });

      for (const order of orders) {
        // 不是托管订单 && 距离过期时间还很久：跳过
        if (!order.planId && order.expiredAt) {
          const threshold = now + Math.max(0, earlyRecoveryTimeMin) * 60;
          if (order.expiredAt > threshold) continue;
        }

        if (!order.toAddr) continue;

        let resource: Record<string, any>;
        try {
          resource = await this.tronResource.getAccountResource(order.toAddr);
        } catch (e) {
          continue;
        }

        if (order.type === "E") {
          await this.checkEnergyReclaim(order.orderId, resource);
        }
        if (order.type === "B") {
          await this.checkBandwidthReclaim(order.orderId, resource);
        }
      }
    } finally {
      this.earlyRunning = false;
    }
  }

  private pickNum(data: any, keys: string[], fallback = 0): number {
    for (const k of keys) {
      const v = data?.[k];
      if (v !== undefined && v !== null && v !== "") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
    }
    return fallback;
  }

  /** 对标 PHP checkBandwidthReclaim */
  private async checkBandwidthReclaim(orderId: number, data: any) {
    const leaseRepo = await getLeaseRecordsRepository();
    const sysRepo = await getSysCfgRepository();
    const order = await leaseRepo.findOne({ where: { orderId } });
    if (!order) return;

    const netLimit = this.pickNum(data, ["NetLimit", "netLimit"], 0);
    const netUsed = this.pickNum(data, ["NetUsed", "netUsed"], 0);
    const netLeft = netLimit - netUsed;

    const earlyLimit = Number(
      await getSetting(sysRepo, "earlyNetRecoveryAmount").catch(() => "300")
    );

    if (netLeft < (Number.isFinite(earlyLimit) ? earlyLimit : 300)) {
      await this.reclaimQueue.add("default", { orderId: order.orderId });
    }
  }

  /** 对标 PHP checkEnergyReclaim（实现非托管的提前回收 + 托管触发回收） */
  private async checkEnergyReclaim(orderId: number, data: any) {
    const leaseRepo = await getLeaseRecordsRepository();
    const sysRepo = await getSysCfgRepository();
    const order = await leaseRepo.findOne({ where: { orderId } });
    if (!order) return;

    const energyLimit = this.pickNum(data, ["EnergyLimit", "energyLimit"], 0);
    const energyUsed = this.pickNum(data, ["EnergyUsed", "energyUsed"], 0);
    const energyLeft = energyLimit - energyUsed;

    // 快捷指令订单：触发回收
    if (order.source === LEASE_RECORDS_SOURCE.SHORTCUTS) {
      const planUsedReclaim = Number(
        await getSetting(sysRepo, "planUsedReclaim").catch(() => "5000")
      );
      const singleAmount = Number(
        await getSetting(sysRepo, "singleAmount").catch(() => "65000")
      );
      const noUEnergyAmount = Number(
        await getSetting(sysRepo, "noUEnergyAmount").catch(() =>
          String(
            (Number.isFinite(singleAmount) && singleAmount > 0
              ? singleAmount
              : 65000) * 2
          )
        )
      );
      const shortcutsPrice = Number(
        await getSetting(sysRepo, "shortcutsPrice").catch(() => "6")
      );

      const limit =
        Number.isFinite(noUEnergyAmount) && noUEnergyAmount > 0
          ? noUEnergyAmount
          : 131000;
      const used = limit - energyLeft;

      if (used > (Number.isFinite(planUsedReclaim) ? planUsedReclaim : 5000)) {
        const baseSingle =
          Number.isFinite(singleAmount) && singleAmount > 0
            ? singleAmount
            : 65000;
        const usedCount = Math.min(Math.ceil(used / baseSingle), 2);
        // usedCount=1：说明只用到 1 笔，需退还 1 笔费用（避免重复退还：通过 funds 调账记录幂等）
        if (usedCount === 1) {
          const refundTrx = Number((shortcutsPrice / 2).toFixed(2)) ?? 0;

          if (refundTrx > 0) {
            console.log("指令订单退还金额refundTrx", refundTrx);
            const ds = await getDataSource();
            const qr = ds.createQueryRunner();
            await qr.connect();
            await qr.startTransaction();
            try {
              const now = Math.floor(Date.now() / 1000);

              // 若该订单已存在调账资金记录，则不再重复退还
              const existedAdjust = await qr.manager.count(Funds, {
                where: {
                  orderId: order.orderId,
                  type: FUNDS_TYPE.ADJUST,
                } as any,
              });
              if (existedAdjust > 0) {
                await qr.rollbackTransaction();
                return;
              }

              const userRow = await qr.manager.findOne(User, {
                where: { id: order.uid },
              });
              if (!userRow) {
                throw new Error(`用户不存在 uid=${order.uid}`);
              }

              await qr.manager.increment(
                User,
                { id: order.uid },
                "balance",
                refundTrx
              );
              const freshUser = await qr.manager.findOne(User, {
                where: { id: order.uid },
              });
              const newBalance =
                freshUser?.balance ??
                (
                  Math.round((Number(userRow.balance ?? 0) + refundTrx) * 100) /
                  100
                ).toFixed(2);

              // funds 记录
              const uniqueIdRow = await qr.manager.save(UniqueId, {
                createdAt: now,
              });
              const fundsRow = qr.manager.create(Funds, {
                id: uniqueIdRow.id,
                agentId: null,
                cate: FUNDS_CATE.BUYER,
                type: FUNDS_TYPE.ADJUST,
                uid: order.uid,
                txId: null,
                currency: "TRX",
                exchange: "1.000",
                orderId: order.orderId,
                planId: order.planId ?? null,
                amount: refundTrx.toFixed(2),
                realAmount: null,
                balance: String(newBalance),
                remark: RemarkUtils.addRemark(null, "快捷指令退还1笔费用"),
                createdAt: now,
              });
              await qr.manager.save(Funds, fundsRow);

              order.remark = RemarkUtils.addRemark(
                order.remark,
                "快捷指令退还1笔费用"
              );
              await qr.manager.save(order);

              await qr.commitTransaction();
            } catch (e) {
              await qr.rollbackTransaction();
              throw e;
            } finally {
              await qr.release();
            }
          }
        }

        // 记录本次预计剩余，并推入回收队列
        const left = Math.round(
          limit -
            usedCount * (Number.isFinite(singleAmount) ? singleAmount : 65000)
        );
        order.lastOrderLeft = left;
        order.lastOrderId = order.orderId;
        await leaseRepo.save(order);

        await this.reclaimQueue.add(
          "default",
          { orderId: order.orderId, usedCount },
          { delay: 2_000 }
        );
        return;
      }
    }

    // 托管订单：当使用量超过阈值时触发回收（usedCount 逻辑先保留在 job payload，后续可用于扣减计划 left）
    if (order.planId && order.planId > 0) {
      const ds = await getDataSource();
      const planRepo = ds.getRepository(LeasePlan);
      const plan = await planRepo.findOne({ where: { planId: order.planId } });
      if (plan) {
        const planUsedReclaim = Number(
          await getSetting(sysRepo, "planUsedReclaim").catch(() => "5000")
        );
        const singleAmount = Number(
          await getSetting(sysRepo, "singleAmount").catch(() => "65000")
        );
        const used = plan.limit - energyLeft;
        const planActive = plan.status === 10;

        if (
          planActive &&
          used > (Number.isFinite(planUsedReclaim) ? planUsedReclaim : 5000)
        ) {
          const existNext = await leaseRepo.count({
            where: { lastOrderId: order.orderId },
          });
          if (existNext > 0) {
            return;
          }
          const usedCount = Math.min(
            Math.ceil(
              used / (Number.isFinite(singleAmount) ? singleAmount : 65000)
            ),
            2
          );

          // 记录本次预计剩余（对标 PHP LeasePlan::setLastOrderLeft 行为）
          const left = Math.round(plan.limit - usedCount * singleAmount);
          order.lastOrderLeft = left;
          order.lastOrderId = order.orderId;
          await leaseRepo.save(order);

          await this.reclaimQueue.add(
            "default",
            { orderId: order.orderId, usedCount },
            { delay: 2_000 }
          );
          return;
        }
      }
    }

    // 非托管提前回收：能量剩余低于阈值则触发回收
    const earlyLimit = Number(
      await getSetting(sysRepo, "earlyRecoveryAmount").catch(() => "0")
    );
    if (energyLeft < (Number.isFinite(earlyLimit) ? earlyLimit : 0)) {
      order.lastOrderLeft = energyLeft;
      await leaseRepo.save(order);

      await this.reclaimQueue.add("default", { orderId: order.orderId });

      // 送的带宽：parent_order_id = 当前订单
      const freeBw = await leaseRepo.findOne({
        where: { parentOrderId: order.orderId },
      });
      if (freeBw) {
        freeBw.remark = RemarkUtils.addRemark(
          freeBw.remark,
          `系统随能量提前回收(${order.orderId})`
        );
        await leaseRepo.save(freeBw);
        await this.reclaimQueue.add("default", { orderId: freeBw.orderId });
      }
    }
  }

  private async scanPlanReclaim() {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const energyRepo = await getEnergyRecordsRepository();

    // 托管2：池子已发起回收，等待链上确认
    const plans = await planRepo.find({
      where: { cate: LEASE_PLAN_CATE.PLAN2 } as any,
    });
    if (!plans.length) return;

    const candidates = plans.filter(
      (p) =>
        p.energyPoolStatus === LEASE_POOL_STATUS.WAITING_RECLAIMED ||
        p.netPoolStatus === LEASE_POOL_STATUS.WAITING_RECLAIMED
    );
    if (!candidates.length) return;

    const now = Math.floor(Date.now() / 1000);

    for (const plan of candidates) {
      let changed = false;

      // 能量池回收确认
      if (
        plan.energyPoolStatus === LEASE_POOL_STATUS.WAITING_RECLAIMED &&
        plan.energyReclaimTxId
      ) {
        const energy = await energyRepo.findOne({
          where: {
            txId: plan.energyReclaimTxId,
            status: ENERGY_RECORDS_STATUS.PENDING,
          },
        });
        if (energy) {
          energy.planId = plan.planId;
          energy.status = ENERGY_RECORDS_STATUS.SUCCESS;
          energy.finishedAt = now;
          await energyRepo.save(energy);

          plan.energyPoolStatus = LEASE_POOL_STATUS.FINISHED;
          plan.energyReclaimAt = energy.timestamp;
          changed = true;
        }
      }

      // 带宽池回收确认（同样使用 energy_records 记录 tx）
      if (
        plan.netPoolStatus === LEASE_POOL_STATUS.WAITING_RECLAIMED &&
        plan.netReclaimTxId
      ) {
        const energy = await energyRepo.findOne({
          where: {
            txId: plan.netReclaimTxId,
            status: ENERGY_RECORDS_STATUS.PENDING,
          },
        });
        if (energy) {
          energy.planId = plan.planId;
          energy.status = ENERGY_RECORDS_STATUS.SUCCESS;
          energy.finishedAt = now;
          await energyRepo.save(energy);

          plan.netPoolStatus = LEASE_POOL_STATUS.FINISHED;
          plan.netReclaimAt = energy.timestamp;
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
   * 托管2：计划已关闭但池子仍处于已代理（未发起回收）则入队回收池子
   * - cate=PLAN2
   * - status=INACTIVE
   * - energy_pool_status / net_pool_status 只要不是 init 或 FINISHED 都需要回收
   */
  private async scanColsePlanDelegated() {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const plans = await planRepo.find({
      where: { cate: LEASE_PLAN_CATE.PLAN2, status: LEASE_PLAN_STATUS.INACTIVE } as any,
    });
    if (!plans.length) return;

    for (const plan of plans) {
      const energyStatus = plan.energyPoolStatus ?? 0;
      const netStatus = plan.netPoolStatus ?? 0;
      const isInit = (s: number) => s === LEASE_POOL_STATUS.INIT; // init
      const isFinished = (s: number) => s === LEASE_POOL_STATUS.FINISHED;

      if (!isInit(energyStatus) && !isFinished(energyStatus)) {
        await this.plan2ReclaimQueue.add(
          "default",
          { planId: plan.planId, type: "E" },
          { jobId: `plan2_reclaim_${plan.planId}_E`, removeOnComplete: true }
        );
      }
      if (!isInit(netStatus) && !isFinished(netStatus)) {
        await this.plan2ReclaimQueue.add(
          "default",
          { planId: plan.planId, type: "B" },
          { jobId: `plan2_reclaim_${plan.planId}_B`, removeOnComplete: true }
        );
      }
    }
  }
}
