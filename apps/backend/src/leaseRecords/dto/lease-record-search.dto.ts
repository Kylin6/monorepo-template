import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common';

/**
 * 资源订单搜索DTO
 */
export class LeaseRecordSearchDto extends PaginationQueryDto {
  @ApiProperty({
    description: '用户Id',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '用户Id必须是整数' })
  uid?: number;

  @ApiProperty({
    description: '代理Id',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '代理Id必须是整数' })
  agentId?: number;

  @ApiProperty({
    description: '订单号',
    // example: 123456,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '订单号必须是整数' })
  orderId?: number;

  @ApiProperty({
    description: '资源类型（E: 能量, B: 带宽）',
    example: 'E',
    enum: ['E', 'B'],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['E', 'B'], { message: '资源类型必须是 E 或 B' })
  type?: 'E' | 'B';

  @ApiProperty({
    description: '交易hash',
    // example: 'abc123...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '交易hash必须是字符串' })
  txId?: string;

  @ApiProperty({
    description: '订单状态',
    // example: 10,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '订单状态必须是整数' })
  status?: number;

  @ApiProperty({
    description:
      '订单来源（20: 前台订单, 24: telegram订单, 25: 赠送带宽订单, 22: api订单, 23: 自动托管）',
    // example: 24,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '订单来源必须是整数' })
  source?: number;

  @ApiProperty({
    description: '发起地址（模糊搜索）',
    // example: 'TRX...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '发起地址必须是字符串' })
  fromAddr?: string;

  @ApiProperty({
    description: '接收地址（模糊搜索）',
    // example: 'TRX...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '接收地址必须是字符串' })
  toAddr?: string;

  @ApiProperty({
    description: '创建时间起始（Unix时间戳）',
    // example: 1700000000,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '创建时间起始必须是整数' })
  @Min(0, { message: '创建时间起始必须大于等于0' })
  startAt?: number;

  @ApiProperty({
    description: '创建时间结束（Unix时间戳）',
    // example: 1700086400,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '创建时间结束必须是整数' })
  @Min(0, { message: '创建时间结束必须大于等于0' })
  endAt?: number;
}
