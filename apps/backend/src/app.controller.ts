import { Controller, Get, Post, Body, Inject, Optional } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import {
  BaseController,
  CurrentUserInfo,
  OPERATION_LOGGER,
  IOperationLogger,
  QUEUE_NAMES,
  type TronDelegateJobData,
  type TronQueueSetBody,
  type TronReclaimJobData,
} from "@common/index";
import { AppService } from "./app.service";

@Controller()
export class AppController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly appService: AppService
  ) {
    super(request, operationLogger);
  }

  @Get()
  getHello() {
    return this.success(this.appService.getHello());
  }

  @Post("enqueue")
  async enqueue(@Body() body: Record<string, unknown>) {
    await this.appService.enqueueExampleJob(body ?? {});
    return this.success({ ok: true });
  }

  /**
   * 创建 Redis 键值 或 写入 Tron 队列
   * - key = "tron-delegate" 时，value 必须为 TronDelegateJobData
   * - key = "tron-reclaim" 时，value 必须为 TronReclaimJobData
   * - 其他 key 为普通 Redis set
   */
  @Post("redis/set")
  async setRedisKey(
    @Body()
    body: TronQueueSetBody | { key: string; value: unknown }
  ) {
    const { key, value } = body ?? {};
    if (!key) {
      return this.error(400, "key 不能为空");
    }
    if (value === undefined) {
      return this.error(400, "value 不能为空");
    }

    if (key === QUEUE_NAMES.TRON_DELEGATE) {
      await this.appService.enqueueTronDelegateJob(
        value as TronDelegateJobData
      );
      return this.success({ ok: true, via: "tron-delegate-queue" });
    }
    if (key === QUEUE_NAMES.TRON_RECLAIM) {
      await this.appService.enqueueTronReclaimJob(value as TronReclaimJobData);
      return this.success({ ok: true, via: "tron-reclaim-queue" });
    }

    const result = await this.appService.setRedisKey(key, value);
    return this.success(result);
  }
}
