export const QUEUE_NAMES = {
  EXAMPLE: "example_queue",
  TRON_DELEGATE: "tron-delegate",
  TRON_RECLAIM: "tron-reclaim",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export { BaseController, type CurrentUserInfo } from "./base.controller";
export { IResponseShape, ErrorCode } from "./response.interface";
export {
  IOperationLogger,
  OPERATION_LOGGER,
} from "./operation-logger.interface";

// 业务异常（由各 app 的异常过滤器决定如何转换为 HTTP 响应）
export { BusinessException } from "./exceptions/business.exception";

// 代码文本映射
export {
  CODE_TEXT_MAPPINGS,
  type CodeTextMappings,
} from "./code-text.constants";

// 工具
export { RemarkUtils, type RemarkEntry } from "./utils/remark.utils";
export { TronUtils } from "./utils/tron.utils";

// 队列键（多项目共用）
export {
  MANUAL_RECLAIM,
  RECLAIM_QUEUE_KEY,
  DELEGATE_QUEUE_KEY,
  U2T_EXCHANGE_QUEUE_KEY,
  SYNC_PLAN_ADDR_TRANSACTION_QUEUE_KEY,
  TELEGRAM_RECHARGE_NOTIFY,
  TELEGRAM_DURATION_ORDER_NOTIFY,
  LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY,
  LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY,
} from "./constants/queue-keys";

// Tron 队列入参（键 + 值显式类型）
export type {
  TronResourceType,
  TronDelegateJobData,
  TronReclaimJobData,
  TronQueueKey,
  TronQueueSetBody,
} from "./constants/tron-queue.types";

// 能量记录状态
export {
  ENERGY_STATUS,
  type EnergyStatusValue,
} from "./constants/energy-status";

// 交易记录状态
export {
  TRANSACTION_STATUS,
  type TransactionStatusValue,
} from "./constants/transaction-status";

// 队列发送（由各 app 实现并注入）
export { type IQueueSender, QUEUE_SENDER } from "./queue-sender.interface";
