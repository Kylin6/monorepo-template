/**
 * lease_plan 表 cate 字段枚举，多项目共用
 * @see entities/entities/LeasePlan.ts
 */
export const LEASE_PLAN_CATE = {
  PLAN1: 10, // 套餐1- 先扣费
  PLAN2: 20, // 套餐2- 后扣费
  COUNT: 30, // 笔数套餐（对标 PHP LeasePlan::CATE_COUNT）
} as const;

export type LeasePlanCateValue =
  (typeof LEASE_PLAN_CATE)[keyof typeof LEASE_PLAN_CATE];

export const LEASE_PLAN_STATUS = {
  ACTIVE: 10, // 活跃
  INACTIVE: 0, // 不活跃
} as const;

export type LeasePlanStatusValue =
  (typeof LEASE_PLAN_STATUS)[keyof typeof LEASE_PLAN_STATUS];

export const LEASE_POOL_STATUS = {
  INIT: 0, // 初始状态
  WAITING_DELEGATED: 10, // 待处理
  DELEGATED: 20, // 已代理
  WAITING_RECLAIMED: 30, // 待回收
  FINISHED: 40, // 已回收
} as const;

export type LeasePoolStatusValue =
  (typeof LEASE_POOL_STATUS)[keyof typeof LEASE_POOL_STATUS];