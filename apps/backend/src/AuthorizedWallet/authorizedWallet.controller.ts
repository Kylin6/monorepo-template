import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthorizedWalletService } from "./authorizedWallet.service";
import { AuthorizedWalletSearchDto } from "./dto/authorizedWallet-search.dto";
import { AuthorizedWalletUpdateDto } from "./dto/authorizedWallet-update.dto";
import { BaseController, OPERATION_LOGGER, IOperationLogger } from '@common/index';
import { Optional, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CurrentUserInfo } from '@common/index';
@ApiTags("卖家管理")
@ApiBearerAuth("Bearer")
@Controller("wallets")
export class AuthorizedWalletController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly authorizedWalletService: AuthorizedWalletService
  ) {
    super(request, operationLogger);
  }

  @Get("index")
  @ApiOperation({
    summary: "获取授权钱包列表（分页）",
    description:
      "获取授权钱包列表\n\n" +
      "**搜索字段**：\n" +
      "- addr: 钱包地址\n" +
      "- type: 类型\n" +
      "- status: 状态\n" +
      "- lock: 锁定状态\n",
  })
  async findAll(
    @Query() query: AuthorizedWalletSearchDto
  ) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);

    const { list, total } = await this.authorizedWalletService.findAll(
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

  @Post("set-top")
  @ApiOperation({
    summary: "设置置顶",
    description: "设置置顶",
  })
  async setTop(@Query("id") id: number) {
    await this.authorizedWalletService.setTop(id);
    return this.success();
  }

  @Post("save")
  @ApiOperation({
    summary: "编辑授权钱包",
    description: "编辑授权钱包",
  })
  async update(
    @Query("id") id: number,
    @Body() body: AuthorizedWalletUpdateDto
  ) {
    const walletId = Number(id ?? 0);
    if (!walletId || Number.isNaN(walletId)) {
      throw new BadRequestException("id 参数必填");
    }
    await this.authorizedWalletService.update(walletId, body);
    return this.success();
  }
}
