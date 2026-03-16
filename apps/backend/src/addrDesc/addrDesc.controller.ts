import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Inject,
  Optional,
  ParseIntPipe,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
  ApiBody,
} from "@nestjs/swagger";
import {
  BaseController,
  CurrentUserInfo,
  OPERATION_LOGGER,
  IOperationLogger,
} from "@common/index";
import { AddrDescService } from "./addrDesc.service";
import { AddrDescSearchDto } from "./dto/addr-desc-search.dto";
import { CreateAddrDescDto } from "./dto/create-addr-desc.dto";
import { UpdateAddrDescDto } from "./dto/update-addr-desc.dto";

@ApiTags("地址描述")
@ApiSecurity("X-Access-Token")
@ApiBearerAuth("Bearer")
@Controller("addr-desc")
export class AddrDescController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly addrDescService: AddrDescService
  ) {
    super(request, operationLogger);
  }

  @Get()
  @ApiOperation({
    summary: "获取地址描述列表",
    description:
      "获取地址描述列表（不分页）\n\n**搜索字段**：addr（模糊）、startAt、endAt（Unix 时间戳）",
  })
  async findAll(@Query() query: AddrDescSearchDto) {
    const list = await this.addrDescService.findAll(query);
    return this.success(list);
  }

  @Post("add")
  @ApiOperation({ summary: "添加地址描述" })
  @ApiBody({ type: CreateAddrDescDto })
  async addAddrDesc(@Body() dto: CreateAddrDescDto) {
    await this.addrDescService.addAddrDesc(dto);
    return this.success(undefined, "添加成功");
  }

  @Post("edit")
  @ApiOperation({ summary: "编辑地址描述（按地址更新描述）" })
  @ApiBody({ type: UpdateAddrDescDto })
  async editAddrDesc(@Body() dto: UpdateAddrDescDto) {
    await this.addrDescService.editAddrDesc(dto);
    return this.success(undefined, "编辑成功");
  }

  @Post("delete")
  @ApiOperation({ summary: "删除地址描述" })
  async deleteAddrDesc(@Query("id", ParseIntPipe) id: number) {
    await this.addrDescService.deleteAddrDesc(id);
    return this.success(undefined, "删除成功");
  }
}
