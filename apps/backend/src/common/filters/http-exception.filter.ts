import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ResponseDto } from "../dto/response.dto";
import { ErrorLoggerService } from "../error-logger.service";

/**
 * 全局异常过滤器
 * 统一处理所有HTTP异常，返回 { errCode, errMsg, data } 格式
 */
@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorLogger: ErrorLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & { adminUser?: { id: number; username: string | null } }
    >();

    let status: number;
    let errCode: number;
    let errMsg: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errCode = status;

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        errMsg = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        // 处理 ValidationPipe 的错误格式
        const responseObj = exceptionResponse as any;
        if (Array.isArray(responseObj.message)) {
          errMsg = responseObj.message.join("; ");
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
      errMsg = exception.message || "服务器内部错误";
    } else {
      // 未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errMsg = "未知错误";
    }

    // 返回统一格式
    const result = ResponseDto.error(errCode, errMsg);

    // 异步写入错误日志（不影响返回）
    const logPayload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      errCode,
      errMsg,
      status,
      path: request?.path,
      method: request?.method,
      ip:
        (typeof request?.headers?.["x-forwarded-for"] === "string"
          ? request.headers["x-forwarded-for"].split(",")[0].trim()
          : request?.ip) ?? request?.socket?.remoteAddress,
      userId: request?.adminUser?.id,
      username: request?.adminUser?.username,
    };
    if (exception instanceof Error) {
      logPayload.stack = exception.stack;
      logPayload.name = exception.name;
    }
    Promise.resolve(this.errorLogger.log(logPayload)).catch(() => void 0);

    response.status(status).json(result);
  }
}
