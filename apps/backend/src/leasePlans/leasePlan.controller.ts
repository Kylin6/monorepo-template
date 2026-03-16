import { Controller, Get, Query, BadRequestException, Post, Body } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { LeasePlanService } from "./leasePlan.service";
import { LeasePlan } from "@database/index";
import { PlanLog } from "@database/entities/entities/PlanLog";
import { LeasePlanSearchDto } from "./dto/lease-plan-search.dto";
import { SwitchPlan2Dto } from "./dto/switch-plan2.dto";
import { EditPlan2Dto } from "./dto/edit-plan2.dto";
import { ModifyPlan2PoolDto } from "./dto/modify-plan2-pool.dto";
import {
  BaseController,
  OPERATION_LOGGER,
  IOperationLogger,
  CurrentUserInfo,
} from "@common/index";
import { Optional, Inject } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";

@ApiTags("资源计划管理")
@ApiBearerAuth("Bearer")
@Controller("plans")
export class LeasePlanController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly leasePlanService: LeasePlanService
  ) {
    super(request, operationLogger);
  }

  @Get("records")
  @ApiOperation({
    summary: "获取资源计划列表（分页）",
    description:
      "获取当前登录代理的资源计划列表\n\n" +
      "**搜索字段**：\n" +
      "- planId: 托管ID\n" +
      "- uid: 用户ID\n" +
      "- cate: 类型（10: 托管, 20: 笔数套餐）\n" +
      "- withBandwidth: 带宽情况（10: 包带宽, 0: 不包）\n" +
      "- toAddr: 接收地址（模糊搜索）\n" +
      "- status: 状态\n" +
      "- startAt: 创建时间起始\n" +
      "- endAt: 创建时间结束\n",
  })
  async findAll(@Query() query: LeasePlanSearchDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);

    const { list, total } = await this.leasePlanService.findAll(
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

  @Get("log")
  @ApiOperation({
    summary: "获取资源计划日志列表（分页）",
    description: "获取资源计划日志列表（分页）",
  })
  async findLog(
    @Query("planId") planId: string,
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "10"
  ) {
    const planIdNum = Number(planId);
    if (!planId || Number.isNaN(planIdNum)) {
      throw new BadRequestException("planId 参数必填且必须为数字");
    }
    const pageNum = Number(page ?? 1);
    const pageSizeNum = Number(pageSize ?? 10);
    const { list, total } = await this.leasePlanService.findLog(
      pageNum,
      pageSizeNum,
      planIdNum
    );
    return this.success({
      list,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  }

  // 关闭托管
  @Post("close")
  @ApiOperation({
    summary: "关闭托管",
    description: "关闭托管",
  })
  async close(@Query("planId") planId: string) {
    const planIdNum = Number(planId);
    if (!planId || Number.isNaN(planIdNum)) {
      throw new BadRequestException("planId 参数必填且必须为数字");
    }
    return this.success(await this.leasePlanService.close(planIdNum));
  }

  // 切换为托管2套餐
  @Post("switch-to-plan2")
  @ApiOperation({
    summary: "切换为托管2套餐",
    description: "切换为托管2套餐",
  })
  async switchToPlan2(
    @Query("planId") planId: string,
    @Body() body: SwitchPlan2Dto
  ) {
    const planIdNum = Number(planId);
    if (!planId || Number.isNaN(planIdNum)) {
      throw new BadRequestException("planId 参数必填且必须为数字");
    }
    return this.success(
      await this.leasePlanService.switchToPlan2(planIdNum, body)
    );
  }

  // 编辑托管2套餐
  @Post("edit-plan2")
  @ApiOperation({
    summary: "编辑托管2套餐",
    description: "编辑托管2套餐",
  })
  async editPlan2(
    @Query("planId") planId: string,
    @Body() body: EditPlan2Dto
  ) {
    const planIdNum = Number(planId);
    if (!planId || Number.isNaN(planIdNum)) {
      throw new BadRequestException("planId 参数必填且必须为数字");
    }
    return this.success(
      await this.leasePlanService.editPlan2(planIdNum, body)
    );
  }

  // 修改托管2套餐池子
  @Post("modify-plan2-pool")
  @ApiOperation({
    summary: "修改托管2套餐池子",
    description: "修改托管2套餐池子",
  })
  async modifyPlan2Pool(
    @Query("planId") planId: string,
    @Body() body: ModifyPlan2PoolDto
  ) {
    const planIdNum = Number(planId);
    if (!planId || Number.isNaN(planIdNum)) {
      throw new BadRequestException("planId 参数必填且必须为数字");
    }
    return this.success(
      await this.leasePlanService.modifyPlan2Pool(planIdNum, body)
    );
  }
}
