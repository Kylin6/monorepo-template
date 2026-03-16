import { In } from "typeorm";
import { LeaseRecords as GeneratedLeaseRecords } from "../entities/LeaseRecords";
import {
  getLeaseRecordsRepository,
  getAuthorizedWalletRepository,
  AuthorizedWallet,
} from "../../index";
import { LEASE_RECORDS_STATUS } from "../../constants/lease-records";
import {
  AUTHORIZED_WALLET_AUTO_SELL,
  AUTHORIZED_WALLET_SOURCE,
  AUTHORIZED_WALLET_STATUS,
  AUTHORIZED_WALLET_TYPE,
} from "../../constants/authorized-wallet";
import { LEASE_RECORDS_SOURCE } from "../../constants/lease-records";

export type LeaseExpireType = "D" | "H" | "M" | null;
export type LeaseResourceType = "E" | "B";

/**
 * checkFromAddr 所需的钱包候选信息（从 AuthorizedWallet 实体挑选必要字段即可）
 */
export interface FromAddrCandidate {
  addr: string;
  status?: number | null; // 10 = 正常（按你们表约定）
  weights?: number | null;
  source?: number | null;

  // 资源余额
  energy?: number | null;
  bandwidth?: number | null;

  // 可选：用于更严格过滤（某些表字段可能不存在，保持可选）
  bandwidthTotal?: number | null;
}

export class LeaseRecords extends GeneratedLeaseRecords {
  /**
   * 参考 PHP LeaseRecords::calculateExpire，将 expire + expireType 转为秒数。
   * - D: 天
   * - H: 小时
   * - M/null: 分钟（默认）
   */
  static calculateExpire(expire: number, expireType: LeaseExpireType): number {
    const base = Number(expire ?? 0);
    if (!Number.isFinite(base) || base <= 0) return 0;
    if (expireType === "D") return base * 24 * 3600;
    if (expireType === "H") return base * 3600;
    return base * 60;
  }

  /** 实例方法：基于当前记录计算过期秒数 */
  calculateExpire(): number {
    return LeaseRecords.calculateExpire(this.expire, this.expireType);
  }

  /**
   * 近似实现 PHP LeaseRecords::checkFromAddr：完整复刻 PHP 逻辑，
   * 在内部完成 DB 查询与筛选，返回一个合适的钱包实体。
   *
   * @returns 选中的 AuthorizedWallet；没有合适候选则返回 null
   */
  static async checkFromAddr(
    record: GeneratedLeaseRecords
  ): Promise<AuthorizedWallet | null> {
    const [leaseRepo, walletRepo] = await Promise.all([
      getLeaseRecordsRepository(),
      getAuthorizedWalletRepository(),
    ]);

    // 进行中订单的 fromAddr，避免重复选中同一个 from 地址
    const ongoing = await leaseRepo
      .createQueryBuilder("r")
      .select("DISTINCT r.fromAddr", "fromAddr")
      .where("r.status IN (:...statuses)", {
        statuses: [LEASE_RECORDS_STATUS.PAYED, LEASE_RECORDS_STATUS.DELEGATED],
      })
      .andWhere("r.toAddr = :toAddr", { toAddr: record.toAddr })
      .andWhere("r.type = :type", { type: record.type })
      .getRawMany<{ fromAddr: string | null }>();

    const existAddrs = ongoing
      .map((r) => r.fromAddr)
      .filter((a): a is string => !!a);

    const left = 500;
    const amount = Number(record.amount ?? 0);

    // 候选钱包：状态 ACTIVE，类型为 SELLER 或 SUPPLY（平台）
    const qb = walletRepo
      .createQueryBuilder("w")
      .where("w.status = :status", { status: AUTHORIZED_WALLET_STATUS.ACTIVE })
      // .andWhere("w.type IN (:...types)", {
      //   types: [AUTHORIZED_WALLET_TYPE.SELLER, AUTHORIZED_WALLET_TYPE.SUPPLY],
      // })
      .andWhere(
        existAddrs.length ? "w.addr NOT IN (:...exist)" : "1=1",
        existAddrs.length ? { exist: existAddrs } : {}
      )
      .andWhere("w.addr != :toAddr", { toAddr: record.toAddr });

    if (record.type === "E") {
      qb.andWhere("w.sellEnergy = :sellEnergy", {
        sellEnergy: AUTHORIZED_WALLET_AUTO_SELL.NO,
      })
        .andWhere("w.energy > :minEnergy", {
          minEnergy: amount + left,
        })
        .andWhere("w.bandwidthTotal > :bwLeft", {
          bwLeft: left,
        });
    } else {
      qb.andWhere("w.sellBandwidth = :sellBandwidth", {
        sellBandwidth: AUTHORIZED_WALLET_AUTO_SELL.NO,
      }).andWhere("w.bandwidth > :minBandwidth", {
        minBandwidth: amount + left,
      });
    }

    if ((record as any).planId && (record as any).planId > 0) {
      qb.andWhere("w.source = :source", {
        source: AUTHORIZED_WALLET_SOURCE.PLAN,
      });
    }
    // 托管23,时长订单24,快捷指令27 使用AUTHORIZED_WALLET_TYPE = SELLER 的钱包
    if (
      record.source === LEASE_RECORDS_SOURCE.AUTO ||
      record.source === LEASE_RECORDS_SOURCE.TELEGRAM ||
      record.source === LEASE_RECORDS_SOURCE.SHORTCUTS
    ) {
      qb.andWhere("w.type = :type", {
        type: AUTHORIZED_WALLET_TYPE.SELLER,
      });
    }

    const resourceField = record.type === "E" ? "w.energy" : "w.bandwidth";

    qb.orderBy("w.weights", "DESC")
      .addOrderBy("w.source", "ASC")
      .addOrderBy(resourceField, "DESC")
      .limit(1);

    const wallet = await qb.getOne();
    return wallet ?? null;
  }
}
