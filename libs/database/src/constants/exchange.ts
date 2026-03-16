/**
 * exchange 表 status 字段枚举，多项目共用
 * @see entities/entities/Exchange.ts
 */
export const U2T_EXCHANGE_STATUS = {
  PENDING: 0, // 等待处理
  PROCESSING: 5, // 处理中
  UNKNOWN: 6, // 未知
  SUCCEED: 10, // 成功
} as const;

export type U2TExchangeStatusValue =
  (typeof U2T_EXCHANGE_STATUS)[keyof typeof U2T_EXCHANGE_STATUS];
