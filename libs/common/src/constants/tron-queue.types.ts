/** 资源类型：带宽 或 能量 */
export type TronResourceType = "BANDWIDTH" | "ENERGY";

/** 派发任务（tron-delegate）的 value 结构 */
export interface TronDelegateJobData {
  /** 接收方地址 */
  toAddr: string;
  /** 发起方地址 */
  fromAddr: string;
  resource: TronResourceType;
  /** 单位：TRX（可带小数） */
  amountTrx: number;
  lock?: boolean;
  lockPeriod?: number;
  ownerAddress?: string;
}

/** 回收任务（tron-reclaim）的 value 结构 */
export interface TronReclaimJobData {
  toAddr: string;
  fromAddr: string;
  resource: TronResourceType;
  amountTrx: number;
  ownerAddress?: string;
}

/** Tron 队列的 key：仅允许这两个队列名 */
export type TronQueueKey = "tron-delegate" | "tron-reclaim";

/** 写入 Tron 队列时的键值：key 和 value 一一对应 */
export type TronQueueSetBody =
  | { key: "tron-delegate"; value: TronDelegateJobData }
  | { key: "tron-reclaim"; value: TronReclaimJobData };
