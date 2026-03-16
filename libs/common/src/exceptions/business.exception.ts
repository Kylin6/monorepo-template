/**
 * 业务异常（不直接绑定 HTTP 状态码）
 *
 * - code：业务错误码（例如 400、500 等）
 * - message：错误信息
 *
 * 由各 app 的异常过滤器决定如何把它映射为 HTTP 响应。
 */
export class BusinessException extends Error {
  constructor(public readonly code: number = 400, message: string) {
    super(message);
    this.name = "BusinessException";
  }
}
