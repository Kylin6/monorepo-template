import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common';

/**
 * 资源计划搜索DTO
 */
export class LeasePlanSearchDto extends PaginationQueryDto {
  @ApiProperty({
    description: '托管ID',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '托管ID必须是整数' })
  planId?: number;

  @ApiProperty({
    description: '用户ID',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '用户ID必须是整数' })
  uid?: number;

  @ApiProperty({
    description: '类型（10: 托管, 20: 笔数套餐）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '类型必须是整数' })
  cate?: number;

  @ApiProperty({
    description: '带宽情况（10: 包带宽, 0: 不包）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '带宽情况必须是整数' })
  withBandwidth?: number;

  @ApiProperty({
    description: '接收地址（模糊搜索）',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '接收地址必须是字符串' })
  toAddr?: string;

  @ApiProperty({
    description: '状态',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '状态必须是整数' })
  status?: number;

  @ApiProperty({
    description: '创建时间起始（Unix时间戳）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '创建时间起始必须是整数' })
  @Min(0, { message: '创建时间起始必须大于等于0' })
  startAt?: number;

  @ApiProperty({
    description: '创建时间结束（Unix时间戳）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '创建时间结束必须是整数' })
  @Min(0, { message: '创建时间结束必须大于等于0' })
  endAt?: number;
}
