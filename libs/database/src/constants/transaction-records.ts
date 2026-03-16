export const TRANSACTION_RECORDS_STATUS = {
  PENDING: 0, //等待处理
  DONE: 10, //已检查
  FINISHED: 20, //检查完成
  IGNORE: 5,
} as const;

export type TransactionRecordsStatus = (typeof TRANSACTION_RECORDS_STATUS)[keyof typeof TRANSACTION_RECORDS_STATUS];

export const TRANSACTION_RECORDS_TYPE = { 
  UNKNOWN: 0, //未知
  RECHARGE: 10, //充值
  WITHDRAW: 20, //提现
  U2T_IN: 30,
  U2T_OUT: 40,
  QUICK_ENERGY: 50,
  BOT_QUICK_ENERGY: 51,
  AGENT_ENERGY: 60,
} as const;

export type TransactionRecordsType = (typeof TRANSACTION_RECORDS_TYPE)[keyof typeof TRANSACTION_RECORDS_TYPE];