/**
 * 交易记录状态，与 transaction_records.status 对应
 */
export const TRANSACTION_STATUS = {
  PENDING: 0,
  IGNORE: 5,
  CHECKED: 10,
  DONE: 20,
} as const;

export type TransactionStatusValue =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];
