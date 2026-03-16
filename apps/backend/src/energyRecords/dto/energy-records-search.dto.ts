import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsEnum, Min, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common';

/**
 * 资金账变搜索DTO
 */
export class EnergyRecordSearchDto extends PaginationQueryDto {
  @ApiProperty({
    description: '资源类型',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['E', 'B'], { message: '资源类型必须是 E 或 B' })
  resource?: 'E' | 'B';

  @ApiProperty({
    description: '交易hash',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: '交易hash必须是字符串' })
  txID?: string;

  @ApiProperty({
    description: '类型（Reclaim: 回收, Delegate: 分发）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: '类型必须是字符串' })
  type?: 'Reclaim' | 'Delegate';

  @ApiProperty({
    description: '发起地址（模糊搜索）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: '发起地址必须是字符串' })
  fromAddr?: string;

  @ApiProperty({
    description: '接收地址（模糊搜索）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: '接收地址必须是字符串' })
  toAddr?: string;

  @ApiProperty({
    description: '状态（0: 未处理, 10: 已处理, 20: 已忽略）',
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
