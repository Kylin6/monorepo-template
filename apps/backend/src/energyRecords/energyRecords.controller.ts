import {
  Controller,
  Get,
  Query,
  Post,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnergyRecordsService } from './energyRecords.service';
import { EnergyRecordSearchDto } from './dto/energy-records-search.dto';
import { EnergyManualDto } from './dto/energy-manual.dto';
import { BaseController, OPERATION_LOGGER, IOperationLogger } from '@common/index';
import { Optional, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CurrentUserInfo } from '@common/index';

@ApiTags('区块链能量')
@ApiBearerAuth('Bearer')
@Controller('energy')
export class EnergyRecordsController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly energyRecordsService: EnergyRecordsService
  ) {
    super(request, operationLogger);
  }

  @Get('records')
  @ApiOperation({
    summary: '获取能量账变列表（分页）',
    description:
      '获取能量账变列表\n\n' +
      '**搜索字段**：\n' +
      '- resource: 资源类型（E: 能量, B: 带宽）\n' +
      '- txID: 交易hash\n' +
      '- type: 类型（Reclaim: 回收, Delegate: 分发）\n' +
      '- fromAddr: 发起地址（模糊搜索）\n' +
      '- toAddr: 接收地址（模糊搜索）\n' +
      '- status: 状态（0: 未处理, 10: 已处理, 20: 已忽略）\n' +
      '- startAt: 创建时间起始\n' +
      '- endAt: 创建时间结束\n',
  })
  async findAll(
    @Query() query: EnergyRecordSearchDto,
  ) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);

    const { list, total } = await this.energyRecordsService.findAll(
      page,
      pageSize,
      query,
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

  @Post('ignore')
  @ApiOperation({
    summary: '手动忽略',
    description: '手动忽略',
  })
  async ignore(
    @Query('id', ParseIntPipe) id: number,
    @Body() { remark }: { remark: string },
  ) {
    await this.energyRecordsService.ignore(id, remark);
    return this.success(null, "忽略成功");
  }

  @Post('manual-delegate')
  @ApiOperation({
    summary: '手动内部代理',
    description:
      '手动内部代理\n\n' +
      '**参数**：\n' +
      '- amount: 数量\n' +
      '- expire: 过期时间（秒）\n' +
      '- expireType: 过期时间类型（D: 天, H: 小时, M: 分钟, S: 秒）\n' +
      '- from: 发起地址\n' +
      '- to: 接收地址\n' +
      '- operate: 操作类型（delegate: 分发, reclaim: 回收）\n' +
      '- type: 资源类型（E: 能量, B: 带宽）',
  })
  async manualDelegate(@Body() body: EnergyManualDto): Promise<any> {
    await this.energyRecordsService.manualDelegate(body);
    return this.success(null, "手动内部代理成功");
  }
}
