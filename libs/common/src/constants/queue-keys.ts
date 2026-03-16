/**
 * 队列通道/键名，多项目共用（如能量回收、委托任务队列）
 *
 * 注意：BullMQ 的队列名不能包含 ':'，因此这里使用无冒号的安全名称，
 * 与数据库常量 `lease-records.ts` 中的键值（如 order:delegate:queue:key）解耦。
 */
export {
  RECLAIM_QUEUE_KEY,
  DELEGATE_QUEUE_KEY,
} from "@database/constants/lease-records";

// ================= 托管2套餐池子队列 =================
// 托管2套餐创建池子
export const LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY = "lease_plan2_delegate_pool_queue_key";
// 托管2套餐回收池子队列
export const LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY = "lease_plan2_reclaim_pool_queue_key";

// 手动回收
export const MANUAL_RECLAIM = "manual_reclaim";

// u换t交易
export const U2T_EXCHANGE_QUEUE_KEY = "u2t_exchange_queue_key";

// 同步托管地址交易手续费信息（对标 PHP: sync:plan:addr:transaction）
export const SYNC_PLAN_ADDR_TRANSACTION_QUEUE_KEY =
  "sync_plan_addr_transaction";

// ================= Telegram Bot 通知队列 =================
// 说明：这里放的是 BullMQ 的队列名（不要包含 ':'）
export const TELEGRAM_RECHARGE_NOTIFY = "telegram_recharge_notify";
export const TELEGRAM_DURATION_ORDER_NOTIFY =
  "telegram_duration_order_notify";
