import { Inject, Injectable, Optional, Logger } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { IResponseShape, ErrorCode } from "./response.interface";
import {
  IOperationLogger,
  OPERATION_LOGGER,
} from "./operation-logger.interface";

/**
 * 请求上挂载的当前用户（由各 app 的鉴权中间件注入，如 adminUser）
 */
export interface CurrentUserInfo {
  id: number;
  username: string | null;
  [key: string]: unknown;
}

/**
 * 控制器基类：统一响应格式 + 操作日志
 * 放在 libs/common 供各 app 的控制器继承使用。
 */
@Injectable()
export abstract class BaseController {
  protected readonly logger: Logger;

  constructor(
    @Optional()
    @Inject(REQUEST)
    protected readonly request?: Request & { adminUser?: CurrentUserInfo },
    @Optional()
    @Inject(OPERATION_LOGGER)
    protected readonly operationLogger?: IOperationLogger
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * 成功响应（与 TransformInterceptor 的 ResponseDto 一致，会被直接透传）
   */
  protected success<T>(data?: T, message = "操作成功"): IResponseShape<T> {
    return {
      errCode: ErrorCode.SUCCESS,
      errMsg: message,
      data,
    };
  }

  /**
   * 分页成功响应
   */
  protected paginated<T>(
    list: T[],
    total: number,
    message = "操作成功"
  ): IResponseShape<{ list: T[]; total: number }> {
    return this.success({ list, total }, message);
  }

  /**
   * 失败响应
   */
  protected error(errCode: number, errMsg: string): IResponseShape<undefined> {
    return {
      errCode,
      errMsg,
    };
  }

  /**
   * 获取当前登录用户（由各 app 鉴权中间件挂载到 request.adminUser）
   */
  protected getCurrentUser(): CurrentUserInfo | null {
    return this.request?.adminUser ?? null;
  }

  /**
   * 获取当前请求的客户端 IP（优先 X-Forwarded-For，再 req.ip / socket.remoteAddress）
   */
  protected getClientIp(): string | null {
    if (!this.request) return null;
    const forwarded = this.request.headers["x-forwarded-for"];
    if (forwarded) {
      const first = typeof forwarded === "string" ? forwarded : forwarded[0];
      return first?.trim().split(",")[0]?.trim() ?? null;
    }
    return this.request.ip ?? this.request.socket?.remoteAddress ?? null;
  }

  /**
   * 操作日志（子类在关键操作后调用）：控制台输出 + 若注入了 OPERATION_LOGGER 则按天写入文件等
   */
  protected logOperation(
    action: string,
    details?: Record<string, unknown>
  ): void {
    const payload: Record<string, unknown> = {
      action,
      path: this.request?.path,
      method: this.request?.method,
      ip: this.getClientIp(),
      timestamp: new Date().toISOString(),
      ...details,
    };
    const user = this.getCurrentUser();
    if (user) {
      payload.userId = user.id;
      payload.username = user.username;
    }
    // this.logger.log(JSON.stringify(payload));
    if (this.operationLogger) {
      Promise.resolve(this.operationLogger.log(payload)).catch((err) =>
        this.logger.warn?.("Operation log write failed", err)
      );
    }
  }
}
