/**
 * 操作日志写入接口：由各 app 实现（如按天写入文件）
 */
export interface IOperationLogger {
  log(payload: Record<string, unknown>): void | Promise<void>;
}

/** 注入 token，在 app 中 provide 具体实现（如按天写文件的 Service） */
export const OPERATION_LOGGER = Symbol("OPERATION_LOGGER");
