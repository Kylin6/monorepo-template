/**
 * 队列发送接口，多项目可各自实现（如 BullMQ、NATS、Redis Pub/Sub）
 */
export interface IQueueSender {
  send(queueKey: string, payload: Record<string, unknown>): Promise<void>;
}

/** 用于 Nest DI 的 token */
export const QUEUE_SENDER = Symbol("QUEUE_SENDER");
