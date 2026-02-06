/**
 * 统一响应接口
 */
export interface IResponse<T = any> {
  errCode: number;
  errMsg: string;
  data?: T;
}

/**
 * 错误码枚举
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
