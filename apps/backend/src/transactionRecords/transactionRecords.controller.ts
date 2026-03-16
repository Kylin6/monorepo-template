import {
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from "@nestjs/swagger";
import { TransactionRecordsService } from "./transactionRecords.service";
import { TransactionRecordSearchDto } from "./dto/transaction-records.dto";
import {
  BaseController,
  OPERATION_LOGGER,
  IOperationLogger,
} from "@common/index";
import { Optional, Inject } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { CurrentUserInfo } from "@common/index";

@ApiTags("交易记录管理")
@ApiBearerAuth("Bearer")
@Controller("transaction")
export class TransactionRecordsController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly transactionRecordsService: TransactionRecordsService
  ) {
    super(request, operationLogger);
  }

  @Get("records")
  @ApiOperation({
    summary: "获取交易记录列表（分页）",
    description:
      "获取交易记录列表\n\n" +
      "**搜索字段**：\n" +
      "- currency: 币种（USDT, TRX）\n" +
      "- txID: 交易hash\n" +
      "- fromAddr: 发起地址（模糊搜索）\n" +
      "- toAddr: 接收地址（模糊搜索）\n" +
      "- type: 类型（10: 充值, 20: 消费, 30: 提现, 40: 调账）\n" +
      "- status: 状态（0: 未处理, 10: 已处理, 20: 已忽略）\n" +
      "- startAt: 创建时间起始\n" +
      "- endAt: 创建时间结束\n",
  })
  async findAll(@Query() query: TransactionRecordSearchDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);

    const { list, total } = await this.transactionRecordsService.findAll(
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

  @Post("ignore")
  @ApiOperation({
    summary: "手动忽略",
    description: "手动忽略",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        remark: { type: "string" },
      },
      required: ["remark"],
    },
  })
  async ignore(
    @Query("id", ParseIntPipe) id: number,
    @Body() { remark }: { remark: string }
  ) {
    await this.transactionRecordsService.ignore(id, remark);
    return this.success(null, "忽略成功");
  }
}
