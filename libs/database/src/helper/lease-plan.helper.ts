import { DataSource } from "typeorm";
import { LeasePlan } from "../entities/entities/LeasePlan";
import { LeaseRecords } from "../entities/entities/LeaseRecords";
import { Users } from "../entities/entities/Users";
import { Funds } from "../entities/entities/Funds";
import { SysCfg } from "../entities/entities/SysCfg";
import { PlanLog } from "../entities/entities/PlanLog";
import { UniqueId } from "../entities/entities/UniqueId";
import { LEASE_PLAN_CATE } from "../constants/lease-plan";
import { FUNDS_TYPE } from "../constants/funds";
import { LEASE_RECORDS_STATUS } from "../constants/lease-records";
import { TronHelper } from "./tron.helper";
import { createUniqueId } from "./unique-id.helper";
import { FundsModel } from "../entities/models/Funds";
import { getSetting } from "./sys-cfg.helper";
import { addRemark } from "./remark.helper";

/**
 * 对标 PHP LeasePlan::createAutoLease($lastOrderId, $left)
 *
 * 注意：
 * - 该 helper 不依赖 Nest，仅依赖 TypeORM DataSource 与数据库实体/常量
 * - TS 映射：PLAN1(10) 视为 PHP CATE_AUTO（需要扣余额）
 */
export async function createAutoEnergyLease(
  ds: DataSource,
  plan: LeasePlan,
  lastOrderId: number | null = null,
  left: number = 0
): Promise<LeaseRecords | null> {
  const now = Math.floor(Date.now() / 1000);
  return ds.transaction(async (manager) => {
    const uniqueIdRepo = manager.getRepository(UniqueId);
    const leaseRepo = manager.getRepository(LeaseRecords);
    const userRepo = manager.getRepository(Users);
    const fundsRepo = manager.getRepository(Funds);
    const planRepo = manager.getRepository(LeasePlan);
    const planLogRepo = manager.getRepository(PlanLog);
    const sysCfgRepo = manager.getRepository(SysCfg);

    if (!plan.toAddr) return null;
    if (!plan.uid) return null;

    const user = await userRepo.findOne({ where: { id: plan.uid } });
    if (!user) return null;

    // 单价从 syscfg 获取（对标：不再依赖 agent 价格）
    // 约定：autoLeasePrice 为每单位资源的基础单价（单位：sun）
    const basePriceSun = Number(
      await getSetting(sysCfgRepo as any, "autoLeasePrice").catch(() => "0")
    );
    const userFloatSun = Number(user.planEnergyPriceFloat ?? 0) || 0;
    const finalPriceSun = basePriceSun + userFloatSun;
    if (!Number.isFinite(finalPriceSun) || finalPriceSun <= 0) return null;

    const amount = Number(plan.limit ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const used = amount - (Number(left) || 0);
    const usedFinal = used > 0 ? used : amount;

    const costTrx =
      Math.round(TronHelper.fromSun(finalPriceSun * usedFinal) * 100) / 100;

    // 带宽费用：从 SysCfg.countBandwidthPrice 读取（单位：TRX）
    let netCostTrx = 0;
    if (plan.withBandwidth) {
      const bwStr = await getSetting(
        sysCfgRepo as any,
        "countBandwidthPrice"
      ).catch(() => "0");
      const bw = Number(bwStr);
      if (Number.isFinite(bw) && bw > 0) {
        netCostTrx = Math.round(bw * 100) / 100;
      }
    }

    const totalCostTrx = Math.round((costTrx + netCostTrx) * 100) / 100;

    const shouldCharge = plan.cate === LEASE_PLAN_CATE.PLAN1;
    const userBalance = Number(user.balance ?? 0);
    if (shouldCharge && (!Number.isFinite(userBalance) || totalCostTrx > userBalance)) {
      plan.status = 0;
      plan.lastCheckAt = now;
      await planRepo.save(plan);
      const remarkText = `余额不足:${totalCostTrx}(${user.balance})`;
      const finalRemark =
        addRemark(null, remarkText) ??
        JSON.stringify([{ time: now, contents: remarkText }]);
      await planLogRepo.save(
        planLogRepo.create({
          uid: plan.uid,
          agentId: plan.agentId ?? null,
          planId: plan.planId,
          operate: 0,
          remark: finalRemark,
          createdAt: now,
        } as any)
      );
      return null;
    }

    const newUserBalance = shouldCharge
      ? (Math.round((userBalance - totalCostTrx) * 100) / 100).toFixed(2)
      : Number(user.balance ?? 0).toFixed(2);

    const orderId = await createUniqueId(uniqueIdRepo);

    const order = leaseRepo.create({
      orderId,
      uid: plan.uid,
      agentId: plan.agentId ?? null,
      type: TronHelper.RESOURCE_TYPE_ENERGY,
      amount: String(amount),
      expire: 1,
      expireType: "D",
      expiredAt: null,
      toAddr: plan.toAddr,
      cost: costTrx.toFixed(2),
      price: finalPriceSun.toFixed(2),
      agentPrice: null,
      agentCost: null,
      netCost: netCostTrx.toFixed(2),
      agentNetCost: null,
      totalCost: totalCostTrx.toFixed(2),
      agentTotalCost: null,
      agentCommission: null,
      commission: "0.00",
      status: LEASE_RECORDS_STATUS.PAYED,
      source: FUNDS_TYPE.PLAN_ORDER,
      planId: plan.planId,
      lastOrderLeft: Number(left) || 0,
      lastOrderId: lastOrderId ?? null,
      createdAt: now,
      balance: newUserBalance,
    } as any) as unknown as LeaseRecords;

    await leaseRepo.save(order);

    if (shouldCharge) {
      await manager.decrement(Users, { id: plan.uid }, "balance", totalCostTrx);

      const userFundsData = await FundsModel.createLeaseFundsData(
        order,
        newUserBalance,
        uniqueIdRepo
      );
      userFundsData.type = FUNDS_TYPE.PLAN_ORDER;
      userFundsData.planId = plan.planId;
      const userFunds = fundsRepo.create(userFundsData as any);
      await fundsRepo.save(userFunds);
    }

    return order;
  });
}

/**
 * 创建托管 2.0 订单
 * - 单价：SysCfg.autoLease2Price + user.planEnergyPriceFloat（单位：sun）
 * - 订单状态：FINISHED
 * - source：FUNDS_TYPE.PLAN2_ORDER
 * - 会扣减用户余额并写一条资金流水（type=PLAN2_ORDER）
 */
export async function createPlan2Lease(
  ds: DataSource,
  plan: LeasePlan,
  amount: number
): Promise<LeaseRecords | null> {
  const now = Math.floor(Date.now() / 1000);
  return ds.transaction(async (manager) => {
    const uniqueIdRepo = manager.getRepository(UniqueId);
    const leaseRepo = manager.getRepository(LeaseRecords);
    const userRepo = manager.getRepository(Users);
    const fundsRepo = manager.getRepository(Funds);
    const sysCfgRepo = manager.getRepository(SysCfg);

    if (!plan.toAddr) return null;
    if (!plan.uid) return null;

    const user = await userRepo.findOne({ where: { id: plan.uid } });
    if (!user) return null;

    // 单价：autoLeasePrice + 用户托管浮动价（planEnergyPriceFloat），单位 sun
    const basePriceSun = Number(
      await getSetting(sysCfgRepo as any, "autoLeasePrice").catch(() => "0")
    );
    const userFloatSun = Number(user.planEnergyPriceFloat ?? 0) || 0;
    const finalPriceSun = basePriceSun + userFloatSun;
    if (!Number.isFinite(finalPriceSun) || finalPriceSun <= 0) return null;

    const finalAmount = Number(amount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) return null;

    const costTrx =
      Math.round(TronHelper.fromSun(finalPriceSun * finalAmount) * 100) / 100;
    if (costTrx <= 0) return null;

    // 包带宽费用
    let netCostTrx = 0;
    if (plan.withBandwidth) {
      const bwStr = await getSetting(
        sysCfgRepo as any,
        "countBandwidthPrice"
      ).catch(() => "0");
      const bw = Number(bwStr);
      if (Number.isFinite(bw) && bw > 0) {
        netCostTrx = Math.round(bw * 100) / 100;
      }
    }

    const totalCostTrx = Math.round((costTrx + netCostTrx) * 100) / 100;

    const userBalance = Number(user.balance ?? 0);
    if (!Number.isFinite(userBalance) || userBalance < totalCostTrx) {
      // 余额不足时直接失败，由上层决定是否提示
      return null;
    }

    const newUserBalance = (
      Math.round((userBalance - totalCostTrx) * 100) / 100
    ).toFixed(2);

    const orderId = await createUniqueId(uniqueIdRepo);

    const order = leaseRepo.create({
      orderId,
      uid: plan.uid,
      agentId: plan.agentId ?? null,
      type: TronHelper.RESOURCE_TYPE_ENERGY,
      amount: String(finalAmount),
      expire: 1,
      expireType: "D",
      expiredAt: null,
      toAddr: plan.toAddr,
      cost: costTrx.toFixed(2),
      price: finalPriceSun.toFixed(2),
      agentPrice: null,
      agentCost: null,
      netCost: netCostTrx.toFixed(2),
      agentNetCost: null,
      totalCost: totalCostTrx.toFixed(2),
      agentTotalCost: null,
      agentCommission: null,
      commission: "0.00",
      status: LEASE_RECORDS_STATUS.FINISHED,
      source: FUNDS_TYPE.PLAN2_ORDER,
      planId: plan.planId,
      lastOrderLeft: 0,
      lastOrderId: null,
      createdAt: now,
      balance: newUserBalance,
    } as any) as unknown as LeaseRecords;

    await leaseRepo.save(order);

    // 扣减用户余额
    await manager.decrement(Users, { id: plan.uid }, "balance", totalCostTrx);

    // 资金流水：PLAN2_ORDER
    const leaseForFunds = {
      agentId: plan.agentId ?? null,
      uid: plan.uid,
      source: FUNDS_TYPE.PLAN2_ORDER,
      orderId: orderId,
      totalCost: totalCostTrx,
      cost: costTrx,
    };
    const fundsData = await FundsModel.createLeaseFundsData(
      leaseForFunds,
      newUserBalance,
      uniqueIdRepo
    );
    fundsData.type = FUNDS_TYPE.PLAN2_ORDER;
    fundsData.planId = plan.planId;
    const fundsRow = fundsRepo.create(fundsData as any);
    await fundsRepo.save(fundsRow);

    return order;
  });
}