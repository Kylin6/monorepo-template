import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto/response.dto';

/**
 * 全局异常过滤器
 * 统一处理所有HTTP异常，返回 { errCode, errMsg, data } 格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let errCode: number;
    let errMsg: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errCode = status;

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errMsg = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        // 处理 ValidationPipe 的错误格式
        const responseObj = exceptionResponse as any;
        if (Array.isArray(responseObj.message)) {
          errMsg = responseObj.message.join('; ');
        } else if (responseObj.message) {
          errMsg = responseObj.message;
        } else if (responseObj.error) {
          errMsg = responseObj.error;
        } else {
          errMsg = exception.message;
        }
      } else {
        errMsg = exception.message;
      }
    } else if (exception instanceof Error) {
      // 处理非HTTP异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errMsg = exception.message || '服务器内部错误';
    } else {
      // 未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errMsg = '未知错误';
    }

    // 返回统一格式
    const result = ResponseDto.error(errCode, errMsg);

    response.status(status).json(result);
  }
}
