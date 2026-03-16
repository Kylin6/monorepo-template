import { Controller, Get, Query, Optional, Inject } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RechargeRecordsService } from "./rechargeRecords.service";
import { RechargeRecordSearchDto } from "./dto/recharge-record-search.dto";
import {
  BaseController,
  OPERATION_LOGGER,
  IOperationLogger,
  CurrentUserInfo,
} from "@common/index";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";

@ApiTags("充值记录管理")
@ApiBearerAuth("Bearer")
@Controller("rechargeList")
export class RechargeRecordsController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly rechargeRecordsService: RechargeRecordsService
  ) {
    super(request, operationLogger);
  }

  @Get("records")
  @ApiOperation({
    summary: "获取充值记录列表（分页）",
    description:
      "获取当前登录代理的充值记录列表\n\n" +
      "**搜索字段**：\n" +
      "- uid: 用户ID\n" +
      "- agentId: 代理Id\n" +
      "- txId: 交易hash\n" +
      "- fromAddr: 转账地址（模糊搜索）\n" +
      "- toAddr: 接收地址（模糊搜索）\n" +
      "- type: 币种类型（USDT, TRX）\n" +
      "- startAt: 创建时间起始\n" +
      "- endAt: 创建时间结束\n",
  })
  async findAll(@Query() query: RechargeRecordSearchDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);

    const { list, total } = await this.rechargeRecordsService.findAll(
      page,
      pageSize,
      query
    );

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
}
