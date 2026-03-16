/**
 * funds 表 type 字段枚举，与表注释一致，多项目共用
 * @see entities/entities/Funds.ts
 */
export const FUNDS_CATE = {
  BUYER: 10, // 买家
  SELLER: 20, // 卖家
  OUT_REACH: 30, // 外部推广
  PRIVATE_AGENT: 40, // 私人代理
} as const;
export type FundsCate = (typeof FUNDS_CATE)[keyof typeof FUNDS_CATE];
// 兼容旧命名（与其它 constants 文件风格一致）
export type FundsCateValue = FundsCate;

export const FUNDS_TYPE = {
  RECHARGE: 10, // 充值
  WEB_ORDER: 20, // 网页订单
  BOT_QUICK_ORDER: 21, // 机器人快速订单
  API_ORDER: 22, // api订单
  PLAN_ORDER: 23, // 计划订单
  PLAN2_ORDER: 35, // 托管2.0订单
  TELEGRAM_ORDER: 24, // telegram订单
  QUICK_ORDER: 25, // 快速订单
  FREE_BANDWIDTH: 26, // 免费带宽
  SHORTCUTS_ORDER: 27, // 快捷指令订单
  DAILY_ENERGY: 28, // 每日能量
  PRIVATE_AGENT: 29,
  PLAN_FEE: 45,
  WITHDRAW: 30,
  CANCEL_ORDER: -10,
  CANCEL_WITHDRAW: 31,
  ADJUSTMENT: 40,
  ADJUST: 40, // 兼容：调账
  INTERNAL_ADJUSTMENT: 41, // 内部代理能量调整
  COMMISSION: 50,

  AGENT_COMMISSION: 51, // 代理佣金
  AGENT_COUNT_COMMISSION: 52, // 代理笔数佣金
  OUT_REACH_COMMISSION: 60, // 外部推广佣金
  PRIVATE_AGENT_COMMISSION: 61,
  ACTIVITY: 70, // 活动
  EXCHANGE: 80,
  AGENT_USER_RECHARGE: 90,
} as const;

export type FundsType = (typeof FUNDS_TYPE)[keyof typeof FUNDS_TYPE];
// 兼容旧命名（与其它 constants 文件风格一致）
export type FundsTypeValue = FundsType;
