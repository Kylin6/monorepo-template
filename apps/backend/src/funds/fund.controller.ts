import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
} from "@nestjs/swagger";
import { PaginationResponseDto } from "../common";
import { FundsService } from "./fund.service";
import { Funds } from "@database/index";
import { FundSearchDto } from "./dto/fund-search.dto";
import { BaseController, OPERATION_LOGGER, IOperationLogger } from '@common/index';
import { Optional, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CurrentUserInfo } from '@common/index';

@ApiTags("资金账变")
@ApiSecurity("X-Access-Token")
@ApiBearerAuth("Bearer")
@Controller("funds")
export class FundsController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly fundsService: FundsService
  ) {
    super(request, operationLogger);
  }

  @Get("records")
  @ApiOperation({
    summary: "获取资金账变列表（分页）",
    description:
      "获取资金账变列表\n\n" +
      "**搜索字段**：\n" +
      "- uid: 用户ID\n" +
      "- orderId: 订单号\n" +
      "- type: 类型（10: 充值, 20: 消费, 30: 提现, 40: 调账）\n" +
      "- cate: 分类（10: 买家, 20: 卖家, 30: 代理）\n" +
      "- currency: 币种（USDT, TRX）\n" +
      "- startAt: 创建时间起始（Unix 时间戳）\n" +
      "- endAt: 创建时间结束（Unix 时间戳）\n",
  })
  async findAll(@Query() query: FundSearchDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);
    const { list, total } = await this.fundsService.findAll(
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
