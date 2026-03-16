import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { In, Not } from "typeorm";
import {
  LeasePlan,
  LeaseRecords,
  PlanLog,
  UniqueId,
  createUniqueId,
  getDataSource,
  getSysCfgRepository,
  LEASE_RECORDS_STATUS,
} from "@database/index";
import { LEASE_PLAN_CATE } from "@database/constants/lease-plan";
import { FUNDS_TYPE } from "@database/constants/funds";
import { TronHelper } from "@database/helper/tron.helper";
import { createAutoEnergyLease } from "@database/helper/lease-plan.helper";
import { getSetting } from "@database/helper/sys-cfg.helper";
import { sendQueueJob } from "@queue/index";
import { DELEGATE_QUEUE_KEY, RECLAIM_QUEUE_KEY } from "@common/index";
import { RemarkUtils } from "@common/index";

/**
 * 对标 PHP WatchPlan.php
 * - new Crontab('1-59/3 * * * * *', ...)
 * - 每 3 秒检查托管计划状态与关联订单
 */
@Injectable()
export class WatchPlanWorker {
  private readonly logger = new Logger(WatchPlanWorker.name);
  private running = false;

  // 对标 PHP Crontab('1-59/3 * * * * *', ...)
  @Cron("1-59/3 * * * * *")
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.processPlans();
    } catch (e) {
      this.logger.error("processPlans error", e as any);
    } finally {
      this.running = false;
    }
  }

  private async processPlans() {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const leaseRepo = ds.getRepository(LeaseRecords);
    const planLogRepo = ds.getRepository(PlanLog);
    const sysRepo = await getSysCfgRepository();

    const now = Math.floor(Date.now() / 1000);

    // 1) 笔数套餐（COUNT）left <= 0 自动关闭
    const expiredCountPlans = await planRepo.find({
      where: {
        cate: LEASE_PLAN_CATE.COUNT,
        status: 10, // PHP LeasePlan::STATUS_ACTIVE
        left: Not(In([1])) as any, // placeholder, will filter below
      } as any,
    });
    for (const p of expiredCountPlans) {
      if ((p.left ?? 0) > 0) continue;
      p.status = 0; // PHP LeasePlan::STATUS_INACTIVE
      p.lastCheckAt = now;
      await planRepo.save(p);
      await planLogRepo.save(
        planLogRepo.create({
          uid: p.uid ?? 0,
          agentId: p.agentId ?? null,
          planId: p.planId,
          operate: 0, // PlanLog::OPERATE_CLOSE
          remark: "笔数套餐已结束",
          createdAt: now,
        }),
      );
    }

    // 2) 所有 active 计划：按 cate desc, planId asc；同地址只保留一条
    const allActive = await planRepo.find({
      where: { status: 10, cate: Not(LEASE_PLAN_CATE.PLAN2) } as any,
      order: { cate: "DESC" as any, planId: "ASC" as any },
    });

    const addresses: string[] = [];
    const activeIds: number[] = [];
    const actives: LeasePlan[] = [];
    for (const active of allActive) {
      if (!active.toAddr) continue;
      if (active.cate === LEASE_PLAN_CATE.COUNT && (active.left ?? 0) <= 0) {
        continue;
      }
      if (!addresses.includes(active.toAddr)) {
        addresses.push(active.toAddr);
        activeIds.push(active.planId);
        actives.push(active);
      }
    }
    if (!activeIds.length) return;

    // 3) 检查每个计划是否有能量订单（source=PLAN_ORDER, type=E, status!=FINISHED/DENY）
    for (const planId of activeIds) {
      const hasEnergyLease = await leaseRepo.exist({
        where: {
          planId,
          source: FUNDS_TYPE.PLAN_ORDER,
          type: TronHelper.RESOURCE_TYPE_ENERGY,
          status: Not(
            In([LEASE_RECORDS_STATUS.FINISHED, LEASE_RECORDS_STATUS.DENY]),
          ),
        } as any,
      });
      if (!hasEnergyLease) {
        // 创建能量订单（简化：amount 取 plan.limit，expire=1D）
        const plan = actives.find((p) => p.planId === planId);
        if (!plan || !plan.toAddr) continue;
        const ds = await getDataSource();
        const order = await createAutoEnergyLease(ds, plan);
        if (order) {
          await sendQueueJob(DELEGATE_QUEUE_KEY, { orderId: order.orderId });
        }
      }
    }

    // 4) 检查 withBandwidth：若缺少带宽订单则创建
    for (const active of actives) {
      if (!active.toAddr) continue;
      if (!active.withBandwidth) continue;

      const netOrder = await leaseRepo.findOne({
        where: {
          planId: active.planId,
          source: FUNDS_TYPE.PLAN_ORDER,
          type: TronHelper.RESOURCE_TYPE_BANDWIDTH,
          status: Not(
            In([LEASE_RECORDS_STATUS.FINISHED, LEASE_RECORDS_STATUS.DENY]),
          ),
        } as any,
      });
      if (!netOrder) {
        const created = await this.createBandwidthOrder(active);
        if (created) {
          await sendQueueJob(DELEGATE_QUEUE_KEY, { orderId: created.orderId });
        }
      }

      // 5) 同地址存在其它 planId 的订单：remark + 推回收队列
      const others = await leaseRepo.find({
        where: {
          toAddr: active.toAddr,
          planId: Not(active.planId) as any,
          status: Not(
            In([LEASE_RECORDS_STATUS.FINISHED, LEASE_RECORDS_STATUS.DENY]),
          ),
        } as any,
      });
      for (const e of others) {
        e.remark = RemarkUtils.addRemark(
          e.remark,
          `托管更新:${e.planId}->${active.planId}`,
        );
        await leaseRepo.save(e);
        await sendQueueJob(RECLAIM_QUEUE_KEY, { orderId: e.orderId });
      }
    }
  }

  /** 对标 PHP createBandwidthOrder */
  private async createBandwidthOrder(
    plan: LeasePlan,
  ): Promise<LeaseRecords | null> {
    const ds = await getDataSource();
    const sysRepo = await getSysCfgRepository();
    const now = Math.floor(Date.now() / 1000);
    return ds.transaction(async (manager) => {
      const uniqueIdRepo = manager.getRepository(UniqueId);
      const leaseRepo = manager.getRepository(LeaseRecords);

      const singleStr = await getSetting(
        sysRepo,
        "singleBandwidthAmount",
      ).catch(() => "0");
      const single = Number(singleStr);
      if (!Number.isFinite(single) || single <= 0) return null;

      const count =
        plan.cate === LEASE_PLAN_CATE.COUNT ? Math.min(plan.left ?? 0, 12) : 12;
      if (count <= 0) return null;

      const orderId = await createUniqueId(uniqueIdRepo);
      const order = leaseRepo.create({
        orderId,
        uid: plan.uid ?? 0,
        agentId: plan.agentId ?? null,
        type: TronHelper.RESOURCE_TYPE_BANDWIDTH,
        amount: String(single * count),
        expire: 1,
        expireType: "D",
        expiredAt: null,
        toAddr: plan.toAddr ?? null,
        cost: "0.00",
        price: "0.00",
        agentPrice: "0.00",
        agentCost: "0.00",
        netCost: "0.00",
        agentNetCost: "0.00",
        totalCost: "0.00",
        agentTotalCost: "0.00",
        agentCommission: "0.00",
        commission: "0.00",
        status: LEASE_RECORDS_STATUS.PAYED,
        source: FUNDS_TYPE.PLAN_ORDER,
        planId: plan.planId,
        lastOrderLeft: 0,
        lastOrderId: null,
        createdAt: now,
        balance: "0.00",
      } as any);

      await leaseRepo.save(order);
      return order as unknown as LeaseRecords;
    });
  }
}
