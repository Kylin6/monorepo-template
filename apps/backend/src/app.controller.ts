import { Controller, Get, Post, Body, Inject, Optional } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import {
  BaseController,
  CurrentUserInfo,
  OPERATION_LOGGER,
  IOperationLogger,
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
}
