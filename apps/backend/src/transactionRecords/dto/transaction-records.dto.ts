import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsEnum, Min, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common';

/**
 * 资金账变搜索DTO
 */
export class TransactionRecordSearchDto extends PaginationQueryDto {
  @ApiProperty({
    description: '币种（USDT, TRX）',
    example: '',
    enum: ['USDT', 'TRX'],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['USDT', 'TRX'], { message: '币种必须是 USDT 或 TRX' })
  currency?: 'USDT' | 'TRX';

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
    description: '类型（10: 充值, 20: 消费, 30: 提现, 40: 调账）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '类型必须是整数' })
  type?: number;

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
    description: '最小金额',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '最小金额必须是整数' })
  minAmount?: number;

  @ApiProperty({
    description: '最大金额',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '最大金额必须是整数' })
  maxAmount?: number;

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
