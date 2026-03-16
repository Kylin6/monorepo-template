export const RECHARGE_APPLY_STATUS = {
  PENDING: 10, // 待处理
  FINISHED: 20, // 已完成
  EXPIRED: -10, // 已过期
} as const;

export type RechargeApplyStatus =
  (typeof RECHARGE_APPLY_STATUS)[keyof typeof RECHARGE_APPLY_STATUS];

export const RECHARGE_APPLY_CATE = {
  RECHARGE: 10, // 充值
  DURATION_LEASE: 20, // 时长租赁-转账
  COUNT_PLAN: 30, // 笔数套餐（对标 PHP RECHARGE_CATE_COUNT_PLAN）
} as const;

export type RechargeApplyCateValue =
  (typeof RECHARGE_APPLY_CATE)[keyof typeof RECHARGE_APPLY_CATE];
