export const SYSTEM_ORDER_ID = -100000;

export const ENERGY_RECORDS_STATUS = {
  PENDING: 0, //未处理
  SUCCESS: 10, //已处理
  IGNORE: 20, //已忽略
} as const;

export type EnergyRecordsStatus = (typeof ENERGY_RECORDS_STATUS)[keyof typeof ENERGY_RECORDS_STATUS];

export const RECORD_OPERATION = {
  DELEGATE: "Delegate",
  UNDELEGATE: "Reclaim",
} as const;

export type RecordOperation = (typeof RECORD_OPERATION)[keyof typeof RECORD_OPERATION];

export const CONTRACT_TYPE = {
  DELEGATION: "DelegateResourceContract",
  UNDELEGATION: "UnDelegateResourceContract",
} as const;

export type ContractType = (typeof CONTRACT_TYPE)[keyof typeof CONTRACT_TYPE];