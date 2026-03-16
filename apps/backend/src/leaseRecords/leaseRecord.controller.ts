import { Controller, Get, Query, Post, Body } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from "@nestjs/swagger";
import { LeaseRecordService } from "./leaseRecord.service";
import { LeaseRecords } from "@database/index";
import { LeaseRecordSearchDto } from "./dto/lease-record-search.dto";
import {
  BaseController,
  OPERATION_LOGGER,
  IOperationLogger,
  CurrentUserInfo,
} from "@common/index";
import { Optional, Inject } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";

@ApiTags("资源订单管理")
@ApiBearerAuth("Bearer")
@Controller("lease")
export class LeaseRecordController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly leaseRecordService: LeaseRecordService
  ) {
    // 目前未使用 BaseController 的方法，这里仅保留注入签名的兼容性
    super(request, operationLogger);
  }

  @Get("record")
  @ApiOperation({
    summary: "获取资源订单列表（分页）",
    description:
      "获取资源订单列表\n\n" +
      "**搜索字段**：\n" +
      "- uid: 用户Id\n" +
      "- agentId: 代理Id\n" +
      "- orderId: 订单号\n" +
      "- type: 资源类型（E: 能量, B: 带宽）\n" +
      "- txId: 交易hash\n" +
      "- status: 订单状态\n" +
      "- source: 订单来源（20: 前台, 24: telegram, 25: 赠送带宽, 22: api, 23: 自动托管）\n" +
      "- fromAddr: 发起地址（模糊搜索）\n" +
      "- toAddr: 接收地址（模糊搜索）\n" +
      "- startAt: 创建时间起始\n" +
      "- endAt: 创建时间结束\n",
  })
  async findAll(
    @Query() query: LeaseRecordSearchDto
  ){
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);

    const { list, total } = await this.leaseRecordService.findAll(
      page,
      pageSize,
      query
    );

    // return this.success({ list, total });
    return this.success({
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }

  @Post("reclaim")
  @ApiOperation({
    summary: "手动回收资源订单",
    description: "手动回收资源订单",
  })
  async reclaim(
    @Query() query: { id: number }
  ): Promise<any> {
    return this.success(await this.leaseRecordService.reclaim(query.id));
  }

  @Post("cancel")
  @ApiOperation({
    summary: "取消资源订单",
    description: "取消资源订单",
  })
  async cancel(
    @Query() query: { id: number }
  ): Promise<any> {
    if (!query.id) {
      throw new Error("订单ID不能为空");
    }
    return this.success(await this.leaseRecordService.cancel(query.id));
  }

  @Post("reclaim-confirm")
  @ApiOperation({
    summary: "确认回收资源订单",
    description: "确认回收资源订单",
  })
  async reclaimConfirm(
    @Query() query: { id: number },
    @Body() body: { txId: string }
  ): Promise<any> {
    return this.success(await this.leaseRecordService.reclaimConfirm(query.id, body.txId));
  }

  @Post("delegate-confirm")
  @ApiOperation({
    summary: "确认已代理订单",
    description: "确认已代理资源订单",
  })
  async delegateConfirm(
    @Query() query: { id: number },
    @Body() body: { txId: string }
  ): Promise<any> {
    return this.success(await this.leaseRecordService.delegateConfirm(query.id, body.txId));
  }
}
