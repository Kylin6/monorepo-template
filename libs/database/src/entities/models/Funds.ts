import type { Repository } from "typeorm";
import { Funds as GeneratedFunds } from "../entities/Funds";
import type { UniqueId } from "../entities/UniqueId";
import { createUniqueId } from "../../helper/unique-id.helper";
import { FUNDS_CATE, FUNDS_TYPE } from "../../constants/funds";
import { addRemark } from "../../helper/remark.helper";

/** addLeaseFunds / addCancelLeaseFunds 所需的 lease 字段 */
export interface LeaseRecordsForFunds {
  agentId?: number | null;
  uid?: number;
  source?: number;
  orderId?: number;
  totalCost?: string | number | null;
  cost?: string | number | null;
}

export class FundsModel extends GeneratedFunds {
  /** 创建时长租赁订单的 funds 数据 */
  static async createLeaseFundsData(
    lease: LeaseRecordsForFunds,
    balance: string,
    uniqueIdRepo: Repository<UniqueId>
  ): Promise<Partial<GeneratedFunds>> {
    const totalCost = Number(lease.totalCost ?? 0);
    const cost = Number(lease.cost ?? 0);
    const id = await createUniqueId(uniqueIdRepo);
    return {
      id,
      agentId: lease.agentId ?? null,
      uid: lease.uid ?? 0,
      cate: FUNDS_CATE.BUYER,
      type: lease.source ?? FUNDS_TYPE.TELEGRAM_ORDER,
      currency: "TRX",
      exchange: "1",
      orderId: lease.orderId ?? null,
      planId: null,
      txId: null,
      amount: String(-totalCost),
      realAmount: String(-cost),
      balance,
      remark: null,
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  /** 创建快捷指令订单的 funds 数据 */
  static async createShortcutsFundsData(
    lease: LeaseRecordsForFunds,
    balance: string,
    uniqueIdRepo: Repository<UniqueId>
  ): Promise<Partial<GeneratedFunds>> {
    const totalCost = Number(lease.totalCost ?? 0);
    const cost = Number(lease.cost ?? 0);
    const id = await createUniqueId(uniqueIdRepo);
    return {
      id,
      agentId: lease.agentId ?? null,
      uid: lease.uid ?? 0,
      cate: FUNDS_CATE.BUYER,
      type: lease.source ?? FUNDS_TYPE.SHORTCUTS_ORDER,
      currency: "TRX",
      exchange: "1",
      orderId: lease.orderId ?? null,
      planId: null,
      txId: null,
      amount: String(-totalCost),
      realAmount: String(-cost),
      balance,
      remark: null,
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  /** 创建调账的 funds 数据 */
  static async createAdjustmentFundsData(
    role: number,
    amount: number,
    agentId: number | null,
    uid: number,
    balance: string,
    remark: string | null,
    uniqueIdRepo: Repository<UniqueId>
  ): Promise<Partial<GeneratedFunds>> {
    const id = await createUniqueId(uniqueIdRepo);
    const finalRemark = addRemark(null, remark);
    return {
      id,
      agentId,
      uid,
      cate: role,
      type: FUNDS_TYPE.ADJUSTMENT,
      currency: "TRX",
      exchange: "1",
      orderId: null,
      planId: null,
      txId: null,
      amount: String(amount),
      realAmount: String(amount),
      balance,
      remark: finalRemark,
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  /** 取消租赁记录的 funds 数据 */
  static async createCancelLeaseFundsData(
    lease: LeaseRecordsForFunds,
    balance: string,
    uniqueIdRepo: Repository<UniqueId>
  ): Promise<Partial<GeneratedFunds>> {
    const cost = Number(lease.cost ?? 0);
    const id = await createUniqueId(uniqueIdRepo);
    return {
      id,
      agentId: lease.agentId ?? null,
      uid: lease.uid ?? 0,
      cate: FUNDS_CATE.BUYER,
      type: FUNDS_TYPE.CANCEL_ORDER,
      currency: "TRX",
      exchange: "1",
      orderId: lease.orderId ?? null,
      planId: null,
      txId: null,
      amount: String(cost),
      realAmount: String(cost),
      balance,
      remark: null,
      createdAt: Math.floor(Date.now() / 1000),
    };
  }
}
