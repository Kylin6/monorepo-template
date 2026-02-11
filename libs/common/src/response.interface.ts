/**
 * 统一响应结构（与 backend TransformInterceptor 一致）
 */
export interface IResponseShape<T = unknown> {
  errCode: number;
  errMsg: string;
  data?: T;
}

/**
 * 常用错误码
 */
export enum ErrorCode {
  SUCCESS = 0,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}
