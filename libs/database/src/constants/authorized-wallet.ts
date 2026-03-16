/**
 * authorized_wallet 表 type 字段枚举，多项目共用
 * @see entities/entities/AuthorizedWallet.ts
 */
export const AUTHORIZED_WALLET_TYPE = {
  MAIN: 10, // 主钱包
  FAST_CHARGE: 20, // 速冲钱包
  SELLER: 30, // 卖家 托管，时长
  SUPPLY: 40, // 供应
  RELAY: 50, // 代理钱包-过桥
} as const;

export type AuthorizedWalletTypeValue =
  (typeof AUTHORIZED_WALLET_TYPE)[keyof typeof AUTHORIZED_WALLET_TYPE];

export const AUTHORIZED_WALLET_ALLOW_AUTO = {
  NONE: 0, //不允许自动
  OUT: 10, //允许自动提现
  RECEIVE: 20, //允许自动接收
} as const;

export const AUTHORIZED_WALLET_SOURCE = {
  PLAN: 10, //来自计划
  NO_PLAN: 0, //来自非计划
} as const;

export const AUTHORIZED_WALLET_STATUS = {
  ACTIVE: 10, //正常
  INACTIVE: 0, //锁定
  AUTO_ACTIVE: 30, //自动激活
} as const;

export const AUTHORIZED_WALLET_AUTO_SELL = {
  NO: 10, //不允许自动出售
  OFF: 0, //允许自动出售
} as const;

export const AUTHORIZED_WALLET_PROPORTION_FIXED = {
  FIXED: 10, //固定分成
} as const;