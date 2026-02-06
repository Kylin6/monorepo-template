import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一响应DTO
 */
export class ResponseDto<T = any> {
  @ApiProperty({ description: '错误码，0表示成功', example: 0 })
  errCode: number;

  @ApiProperty({ description: '错误信息', example: '操作成功' })
  errMsg: string;

  @ApiProperty({ description: '返回数据', required: false })
  data?: T;

  constructor(errCode: number, errMsg: string, data?: T) {
    this.errCode = errCode;
    this.errMsg = errMsg;
    this.data = data;
  }

  /**
   * 成功响应
   */
  static success<T>(data?: T, message = '操作成功'): ResponseDto<T> {
    return new ResponseDto(0, message, data);
  }

  /**
   * 失败响应
   */
  static error(errCode: number, errMsg: string): ResponseDto {
    return new ResponseDto(errCode, errMsg);
  }
}
