import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  BadRequestException,
  Optional,
  Inject,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
} from "@nestjs/swagger";
import { ResourcePriceService } from "./resourcePrice.service";
import {
  BaseController,
  OPERATION_LOGGER,
  IOperationLogger,
} from "@common/index";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { CurrentUserInfo } from "@common/index";
import { BatchSavePriceDto } from "./dto/batch-save-price.dto";
import { DeleteResourcePriceDto } from "./dto/delete-resource-price.dto";
import { ModifyStatusDto } from "./dto/modify-status.dto";

@ApiTags("资源价格")
@ApiSecurity("X-Access-Token")
@ApiBearerAuth("Bearer")
@Controller("resourcePrices")
export class ResourcePriceController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly resourcePriceService: ResourcePriceService,
  ) {
    super(request, operationLogger);
  }

  @Get("records")
  @ApiOperation({
    summary: "获取资源价格列表",
    description: "获取资源价格列表",
  })
  async getResourcePrices(@Query("agentId") agentId?: string) {
    const list = await this.resourcePriceService.getResourcePrices(agentId);
    return this.success({ list });
  }

  @Post("save-price")
  @ApiOperation({
    summary: "批量保存资源价格",
    description:
      "批量保存资源价格，根据 type、expire、expireType 组合的 key 与 agentId 进行 upsert",
  })
  async saveResourcePrice(
    // @Query("agentId") agentId: string,
    @Body() batchSavePriceDto: BatchSavePriceDto,
  ) {
    // if (!agentId) {
    //   throw new BadRequestException("agentId 参数必填");
    // }
    // const agentIdNum = parseInt(agentId, 10);
    // if (isNaN(agentIdNum)) {
    //   throw new BadRequestException("无效的 agentId");
    // }
    const list = await this.resourcePriceService.batchSaveResourcePrice(
      batchSavePriceDto.items,
    );
    return this.success({ list }, "保存成功");
  }

  @Post("delete-price")
  @ApiOperation({
    summary: "删除资源价格",
    description: "删除资源价格，根据 id 删除",
  })
  async deleteResourcePrice(@Query("id") id: string) {
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return this.error(400, "参数不正确");
    }
    await this.resourcePriceService.deleteById(idNum);
    return this.success(null, "删除成功");
  }

  @Post("modify-status")
  @ApiOperation({
    summary: "启用/停用资源价格",
    description: "根据 id 和 status 修改资源价格状态（10 启用，0 停用）",
  })
  async modifyStatus(@Query("id") id: string, @Body("status") status: number) {
    const idNum = Number(id);
    if (!id || Number.isNaN(idNum)) {
      return this.error(400, "参数不正确");
    }
    if (status !== 0 && status !== 10) {
      return this.error(400, "status 只能为 0 或 10");
    }
    await this.resourcePriceService.updateStatus(idNum, status);
    return this.success(null, "状态更新成功");
  }
}
