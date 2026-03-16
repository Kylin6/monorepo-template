import { Repository, Not } from "typeorm";
import { SysCfg } from "../entities/entities/SysCfg";
import { AuthorizedWallet } from "../entities/entities/AuthorizedWallet";
import { AUTHORIZED_WALLET_STATUS } from "../constants/authorized-wallet";

export type SysCfgRepository = Repository<SysCfg>;
export type AuthorizedWalletRepository = Repository<AuthorizedWallet>;

/**
 * 与 PHP AuthorizedWallet 表 type 枚举一致，供本 helper 内钱包查询使用。
 * 若库表由 PHP 项目创建，需与此保持一致。
 * @see php-tron项目/common/models/db/AuthorizedWallet.php
 */
const WALLET_TYPE = {
  MAIN: 0,
  PLATFORM: 10,
  SELLER: 20,
  RECHARGE: 30,
  WITHDRAW: 40,
  QUICK_RECHARGE: 1,
  TRX_RECHARGE: 2,
  USDT_RECHARGE: 3,
  QUICK_USDT2TRX: 4,
  QUICK_USDT_RECEIVER: 5,
} as const;

/** 内存缓存，key = SysCfg.key，value = SysCfg.value */
const configCache = new Map<string, string>();

/**
 * 参考 PHP SysHelper::getSetting
 * 先查内存缓存，未命中则查库并写入缓存；不存在则抛错。
 */
export async function getSetting(
  repo: SysCfgRepository,
  key: string
): Promise<string> {
  const cached = configCache.get(key);
  if (cached !== undefined) return cached;

  const cfg = await repo.findOne({ where: { key } });
  if (!cfg) {
    throw new Error(`配置文件加载失败: ${key}`);
  }
  configCache.set(key, cfg.value);
  return cfg.value;
}

/**
 * 参考 PHP SysHelper::setSetting
 * 更新 sys_cfg 表中对应 key 的 value，并清除该 key 的缓存。
 */
export async function setSetting(
  repo: SysCfgRepository,
  key: string,
  value: string
): Promise<boolean> {
  const cfg = await repo.findOne({ where: { key } });
  if (!cfg) return false;
  cfg.value = value;
  const ok = await repo
    .save(cfg)
    .then(() => true)
    .catch(() => false);
  if (ok) clearCfgCache(key);
  return ok;
}

/**
 * 参考 PHP SysHelper::clearCfgCache
 * 清除指定 key 的内存缓存（本库未接 Redis，仅内存）。
 */
export function clearCfgCache(key: string): void {
  configCache.delete(key);
}

/**
 * 参考 PHP SysHelper::getStakeExchange
 * E -> energyStakeExchange, B -> bandwidthStakeExchange，返回数值。
 */
export async function getStakeExchange(
  repo: SysCfgRepository,
  type: "E" | "B"
): Promise<number> {
  const key = type === "E" ? "energyStakeExchange" : "bandwidthStakeExchange";
  const value = await getSetting(repo, key);
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

/**
 * 参考 PHP SysHelper::checkFreeBandwidth
 * 当前实现固定返回 false（与 PHP 注释掉逻辑一致）。
 */
export function checkFreeBandwidth(): boolean {
  return false;
}

/**
 * 参考 PHP SysHelper::getSellerAddrs
 * 返回 type = SELLER 且状态正常的钱包列表。
 */
export async function getSellerAddrs(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet[]> {
  return repo.find({
    where: {
      type: WALLET_TYPE.SELLER,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getSystemAddrs
 * 返回 type != SELLER 的钱包列表（系统侧钱包）。
 */
export async function getSystemAddrs(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet[]> {
  return repo.find({
    where: {
      type: Not(WALLET_TYPE.SELLER),
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getMainAddr
 * 返回主钱包（type=MAIN, status=ACTIVE）单条。
 */
export async function getMainAddr(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet | null> {
  return repo.findOne({
    where: {
      type: WALLET_TYPE.MAIN,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getWithdrawWallet
 * 返回提现钱包（type=WITHDRAW, status=ACTIVE）单条。
 */
export async function getWithdrawWallet(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet | null> {
  return repo.findOne({
    where: {
      type: WALLET_TYPE.WITHDRAW,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getUsdtRechargeAddr
 */
export async function getUsdtRechargeAddr(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet | null> {
  return repo.findOne({
    where: {
      type: WALLET_TYPE.USDT_RECHARGE,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getTrxRechargeAddr
 */
export async function getTrxRechargeAddr(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet | null> {
  return repo.findOne({
    where: {
      type: WALLET_TYPE.TRX_RECHARGE,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getQuickRechargeAddr
 */
export async function getQuickRechargeAddr(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet | null> {
  return repo.findOne({
    where: {
      type: WALLET_TYPE.QUICK_RECHARGE,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getQuickU2TAddr
 */
export async function getQuickU2TAddr(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet | null> {
  return repo.findOne({
    where: {
      type: WALLET_TYPE.QUICK_USDT2TRX,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}

/**
 * 参考 PHP SysHelper::getQuickUReceiverAddr
 */
export async function getQuickUReceiverAddr(
  repo: AuthorizedWalletRepository
): Promise<AuthorizedWallet | null> {
  return repo.findOne({
    where: {
      type: WALLET_TYPE.QUICK_USDT_RECEIVER,
      status: AUTHORIZED_WALLET_STATUS.ACTIVE,
    },
  });
}
