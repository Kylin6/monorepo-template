import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { In } from "typeorm";
import {
  getDataSource,
  getTransactionRecordsRepository,
  getRechargeApplyRepository,
  getUserRepository,
  getSysCfgRepository,
  createUniqueId,
  TransactionRecords,
  RechargeRecords,
  RechargeApply,
  Funds,
  UniqueId,
  User,
  LeaseRecords,
  ResourcePrice,
  ResourcePriceModel,
} from "@database/index";
import {
  TRANSACTION_RECORDS_STATUS,
  TRANSACTION_RECORDS_TYPE,
  RECHARGE_APPLY_STATUS,
  RECHARGE_APPLY_CATE,
  LEASE_RECORDS_STATUS,
  LEASE_RECORDS_SOURCE,
  DELEGATE_QUEUE_KEY,
} from "@database/index";

import { FUNDS_TYPE, FUNDS_CATE } from "@database/constants/funds";
import { TronHelper } from "@database/helper/tron.helper";
import { getSetting } from "@database/helper/sys-cfg.helper";
import { sendQueueJob } from "@queue/index";
import { TELEGRAM_RECHARGE_NOTIFY } from "@common/index";

/**
 * 对标 PHP WatchRecharge::run（无 agent 逻辑）
 * 每 3 秒扫描系统充值地址的待处理交易，匹配充值申请或绑定钱包用户后执行入账
 */
@Injectable()
export class WatchRechargeWorker {
  private readonly logger = new Logger(WatchRechargeWorker.name);
  private running = false;

  // 对标 PHP Timer::add(3, ...) ，每 3 秒执行
  @Cron("*/3 * * * * *")
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.processRechargeTransactions();
    } catch (err) {
      this.logger.error("processRechargeTransactions error", err as any);
    } finally {
      this.running = false;
    }
  }

  private async processRechargeTransactions() {
    const txRepo = await getTransactionRecordsRepository();
    const applyRepo = await getRechargeApplyRepository();
    const sysRepo = await getSysCfgRepository();

    const addrs = await this.getRechargeAddrs(sysRepo);
    if (!addrs.length) return;

    const transactions = await txRepo.find({
      where: {
        toAddr: In(addrs),
        status: TRANSACTION_RECORDS_STATUS.PENDING,
      },
    });
    if (!transactions.length) return;

    const now = Math.floor(Date.now() / 1000);

    for (const transaction of transactions) {
      try {
        transaction.status = TRANSACTION_RECORDS_STATUS.DONE;
        await txRepo.save(transaction);

        const amountStr = String(transaction.amount ?? "0");
        const currency = transaction.currency ?? "TRX";

        const apply = await this.getRechargeApply(
          applyRepo,
          currency,
          amountStr,
          now
        );
        if (apply) {
          const userRepo = await getUserRepository();
          const user = await userRepo.findOne({ where: { id: apply.uid } });
          if (!user) {
            continue;
          }

          // cate = 10 -> 普通充值，尾数匹配
          if (apply.cate === RECHARGE_APPLY_CATE.RECHARGE) {
            const recharge = await this.doRecharge(user, transaction);
            if (recharge) {
              if (user.telegramId) {
                await sendQueueJob(TELEGRAM_RECHARGE_NOTIFY, {
                  telegramId: user.telegramId,
                  amount: Number(transaction.amount ?? 0),
                  newBalance: Number(user.balance ?? 0),
                  currency: transaction.currency ?? "TRX",
                  txId: transaction.txId,
                  rechargeApplyId: apply.id,
                });
              }
              await this.finishRechargeApply(applyRepo, apply);
            }
            continue;
          }

          // cate = 20 -> 时长订单（金额已在 getRechargeApply 中按 currency+amount 匹配）
          if (apply.cate === RECHARGE_APPLY_CATE.DURATION_LEASE) {
            // 只根据 recharge_apply.extra 自动创建时长订单：
            // - 不做充值入账
            // - 不写资金流水
            // 转账本身即为扣费
            await this.createDurationLeaseOrderFromApply(apply);
            continue;
          }
          continue;
        }

        // const fromAddr = transaction.fromAddr ?? "";
        // const userRepo = await getUserRepository();
        // const userByWallet = await userRepo.findOne({
        //   where: { walletAddr: fromAddr },
        // });
        // if (userByWallet) {
        //   await this.doRecharge(userByWallet, transaction);
        // }
      } catch (e) {
        this.logger.warn(
          `process tx ${transaction.txId} error: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }
    }
  }

  /** 从 SysCfg 读取充值地址列表（key=rechargeAddr 单条，可扩展为多 key） */
  private async getRechargeAddrs(
    sysRepo: Awaited<ReturnType<typeof getSysCfgRepository>>
  ): Promise<string[]> {
    const raw = await getSetting(sysRepo, "rechargeAddr").catch(() => "");
    const addr = (raw ?? "").trim();
    if (!addr) return [];
    return [addr];
  }

  private async getRechargeApply(
    repo: Awaited<ReturnType<typeof getRechargeApplyRepository>>,
    currency: string,
    amount: string,
    now: number
  ): Promise<RechargeApply | null> {
    const row = await repo.findOne({
      where: {
        currency,
        amount: String(amount),
        status: RECHARGE_APPLY_STATUS.PENDING,
      } as any,
    });
    if (!row) return null;
    if ((row.expireAt ?? 0) <= now) return null;
    return row;
  }

  private async finishRechargeApply(
    repo: Awaited<ReturnType<typeof getRechargeApplyRepository>>,
    apply: RechargeApply
  ): Promise<void> {
    apply.status = RECHARGE_APPLY_STATUS.FINISHED;
    await repo.save(apply);
  }

  /**
   * 根据时长租赁充值申请（cate = DURATION_LEASE）自动创建时长订单：
   * - 从 extra 中解析 expire/expireType/targetAddr/能量配置
   * - 按价格表计算订单总价，仅写入 lease_records.cost/totalCost
   * - 不变更用户余额、不写 funds、不创建 recharge_records
   * - 仅创建 lease_records 订单并更新 recharge_apply 状态
   *
   * 若解析或价格计算失败，仅记录日志，不抛出异常，避免影响其他交易处理。
   */
  private async createDurationLeaseOrderFromApply(
    apply: RechargeApply
  ): Promise<void> {
    if (apply.cate !== RECHARGE_APPLY_CATE.DURATION_LEASE) {
      return;
    }

    let extra: Record<string, unknown> = {};
    try {
      extra = (apply.extra && JSON.parse(apply.extra)) || {};
    } catch (e) {
      this.logger.error(
        `parse DURATION_LEASE extra failed, applyId=${apply.id}, extra=${apply.extra}`,
        e as any
      );
      return;
    }

    const expire = Number(extra.expire ?? 0);
    const rawExpireType = String(extra.expireType ?? "M").toUpperCase();
    const expireType = (
      ["D", "H", "M"].includes(rawExpireType) ? rawExpireType : "M"
    ) as "D" | "H" | "M";
    const toAddr = (extra.targetAddr as string) || apply.toAddr || "";
    const resourceType = (extra.resourceType as "E" | "N") ?? "E";

    let count = Number(extra.count ?? apply.count ?? 0);
    let energyPerCount = Number(extra.energyPerCount ?? 0);
    let totalEnergy = Number(extra.totalEnergy ?? 0);

    if (!Number.isFinite(expire) || expire <= 0) {
      this.logger.warn(
        `invalid expire in DURATION_LEASE extra, applyId=${apply.id}, expire=${expire}`
      );
      return;
    }
    if (!toAddr) {
      this.logger.warn(
        `missing target address in DURATION_LEASE extra, applyId=${apply.id}`
      );
      return;
    }

    if (!Number.isFinite(count) || count <= 0) count = 1;
    if (!Number.isFinite(totalEnergy) || totalEnergy <= 0) {
      if (Number.isFinite(energyPerCount) && energyPerCount > 0) {
        totalEnergy = count * energyPerCount;
      } else {
        this.logger.warn(
          `invalid energy params in DURATION_LEASE extra, applyId=${apply.id}`
        );
        return;
      }
    }
    if (!Number.isFinite(energyPerCount) || energyPerCount <= 0) {
      energyPerCount = Math.round(totalEnergy / count) || totalEnergy;
    }

    const ds = await getDataSource();
    try {
      await ds.transaction(async (manager) => {
        const now = Math.floor(Date.now() / 1000);
        const type: "B" | "E" = resourceType === "N" ? "B" : "E";

        const user = await manager.findOne(User, {
          where: { id: apply.uid },
        });
        if (!user) {
          this.logger.warn(
            `user not found when creating DURATION_LEASE order, applyId=${apply.id}, uid=${apply.uid}`
          );
          return;
        }

        const priceRow = await manager.findOne(ResourcePrice, {
          where: {
            status: 10,
            type,
            expire,
            expireType,
            agentId: null as any,
          } as any,
        });
        if (!priceRow) {
          this.logger.warn(
            `price row not found for DURATION_LEASE, applyId=${apply.id}, type=${type}, expire=${expire}, expireType=${expireType}`
          );
          return;
        }

        const finalPricePerUnit = ResourcePriceModel.getFinalPriceForUser(
          priceRow,
          user
        );
        const totalCost =
          Math.round(((totalEnergy * finalPricePerUnit) / 1_000_000) * 100) /
          100;

        if (totalCost <= 0) {
          this.logger.warn(
            `calculated totalCost invalid, applyId=${apply.id}, totalCost=${totalCost}`
          );
          return;
        }

        const uniqueIdRepo = manager.getRepository(UniqueId);
        const orderId = await createUniqueId(uniqueIdRepo);

        const leaseRecord = manager.create(LeaseRecords, {
          orderId,
          uid: apply.uid,
          type,
          amount: String(totalEnergy),
          expire,
          expireType,
          toAddr,
          agentId: null,
          expiredAt: null,
          fromAddr: null,
          price: finalPricePerUnit.toFixed(2),
          cost: totalCost.toFixed(2),
          agentPrice: null,
          agentCost: null,
          commission: "0.00",
          agentCommission: null,
          netCost: null,
          agentNetCost: null,
          totalCost: totalCost.toFixed(2),
          agentTotalCost: null,
          // 这里不再扣减 user.balance，仅记录当前余额到订单中，方便审计
          balance: user.balance,
          status: LEASE_RECORDS_STATUS.PAYED,
          source: LEASE_RECORDS_SOURCE.TELEGRAM,
          createdAt: now,
          progress: 0,
        } as any);
        await manager.save(leaseRecord);

        apply.status = RECHARGE_APPLY_STATUS.FINISHED;
        apply.expireAt = now;
        await manager.save(apply);

        await sendQueueJob(DELEGATE_QUEUE_KEY, { orderId });

        this.logger.log(
          `created DURATION_LEASE order success, applyId=${apply.id}, orderId=${orderId}, totalCost=${totalCost}`
        );
      });
    } catch (e) {
      this.logger.error(
        `createDurationLeaseOrderFromApply transaction failed, applyId=${apply.id}`,
        e as any
      );
    }
  }

  private async doRecharge(
    user: User,
    record: TransactionRecords
  ): Promise<RechargeRecords | null> {
    const amount = Number(record.amount ?? 0);
    if (amount <= 0) return null;

    const ds = await getDataSource();
    return ds.transaction(async (manager) => {
      const currency = record.currency ?? "TRX";
      const recharge =
        currency === "TRX"
          ? await this.addTRXRecord(manager, user, record)
          : await this.addUSDTRecord(manager, user, record);

      record.type = TRANSACTION_RECORDS_TYPE.RECHARGE;
      record.status = TRANSACTION_RECORDS_STATUS.FINISHED;
      await manager.save(record);

      const addAmount = Number(recharge.realAmount ?? recharge.amount);
      await manager.increment(User, { id: user.id }, "balance", addAmount);
      const updated = await manager.findOne(User, {
        where: { id: user.id },
        select: ["balance"],
      });
      const newBalance = updated?.balance ?? String(addAmount);

      await this.addRechargeFunds(manager, recharge, newBalance);
      return recharge;
    });
  }

  private async addTRXRecord(
    manager: any,
    user: User,
    transaction: TransactionRecords
  ): Promise<RechargeRecords> {
    const id = await createUniqueId(manager.getRepository(UniqueId));
    const now = Math.floor(Date.now() / 1000);
    const amount = String(transaction.amount ?? "0");
    const record = manager.getRepository(RechargeRecords).create({
      id,
      agentId: null,
      txId: transaction.txId,
      uid: user.id,
      type: TronHelper.CURRENCY_TRX as "TRX",
      amount,
      realAmount: amount,
      fromAddr: transaction.fromAddr,
      toAddr: transaction.toAddr,
      exchange: "1",
      recharge: "0.00",
      createdAt: now,
    });
    await manager.save(record);
    return record;
  }

  private async addUSDTRecord(
    manager: any,
    user: User,
    transaction: TransactionRecords
  ): Promise<RechargeRecords> {
    const sysRepo = await getSysCfgRepository();
    const exchange = Number(
      await getSetting(sysRepo, "uRechargeExchange").catch(() => "0")
    );
    const amount = Number(transaction.amount ?? 0);
    const realAmount = Number((amount * exchange).toFixed(2));

    const id = await createUniqueId(manager.getRepository(UniqueId));
    const now = Math.floor(Date.now() / 1000);
    const record = manager.getRepository(RechargeRecords).create({
      id,
      agentId: null,
      txId: transaction.txId,
      uid: user.id,
      type: TronHelper.CURRENCY_USDT as "USDT",
      amount: String(transaction.amount),
      realAmount: String(realAmount),
      fromAddr: transaction.fromAddr,
      toAddr: transaction.toAddr,
      exchange: String(exchange),
      recharge: "0.00",
      createdAt: now,
    });
    await manager.save(record);
    return record;
  }

  private async addRechargeFunds(
    manager: any,
    recharge: RechargeRecords,
    balance: string
  ): Promise<void> {
    const id = await createUniqueId(manager.getRepository(UniqueId));
    const row = manager.getRepository(Funds).create({
      id,
      agentId: null,
      cate: FUNDS_CATE.BUYER,
      type: FUNDS_TYPE.RECHARGE,
      uid: recharge.uid,
      txId: recharge.txId,
      currency: recharge.type,
      exchange: recharge.exchange,
      amount: recharge.realAmount ?? recharge.amount,
      realAmount: recharge.realAmount,
      balance,
      remark: null,
      createdAt: Math.floor(Date.now() / 1000),
    });
    await manager.save(row);
  }
}
