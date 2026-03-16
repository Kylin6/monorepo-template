/**
 * lease_records 表 source 字段枚举
 * @see entities/entities/LeaseRecords.ts
 */

export const DELEGATE_QUEUE_KEY = "order_delegate_queue_key";
export const RECLAIM_QUEUE_KEY = "order_reclaim_queue_key";

 export const LEASE_RECORDS_STATUS = {
  PAYED: 10, //待处理
  BROADCASTED: 15, //已广播
  DELEGATED: 20, //已代理
  WAITING_RECLAIMED: 25, //待回收
  FINISHED: 30, //已回收
  UNKNOWN: 26, //未知
  RECLAIM_UNKNOWN: 27, //回收未知
  DENY: -10, //已取消
  RECLAIM_FAILED: -5, //回收失败
 } as const;

 export type LeaseRecordsStatusValue =
  (typeof LEASE_RECORDS_STATUS)[keyof typeof LEASE_RECORDS_STATUS];

export const LEASE_RECORDS_RECLAIM_TYPE = {
  SYSTEM: 0, //系统回收
  MANUAL: 20, //手动回收
  SELLER: 30, //卖家回收
 } as const;

 export type LeaseRecordsReclaimTypeValue =
  (typeof LEASE_RECORDS_RECLAIM_TYPE)[keyof typeof LEASE_RECORDS_RECLAIM_TYPE];

export const LEASE_RECORDS_SOURCE = {
  WEB: 20, // 网页下单
  BOT: 21, // Bot Quick Order
  API: 22, // API下单
  AUTO: 23, // 托管下单
  PLAN2: 35, // 托管2.0下单
  TELEGRAM: 24, // 机器人下单-闪租
  CHANNEL: 25, // 频道下单
  GIFT: 26, // 赠送带宽
  SHORTCUTS: 27, // 快捷指令
  INTERNAL: 10, // 内部订单
} as const;

export type LeaseRecordsSourceValue =
  (typeof LEASE_RECORDS_SOURCE)[keyof typeof LEASE_RECORDS_SOURCE];
