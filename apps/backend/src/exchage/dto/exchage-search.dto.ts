import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common';

/**
 * U换T交易搜索DTO
 */
export class ExchangeSearchDto extends PaginationQueryDto {
  @ApiProperty({
    description: '交易hash（txID）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: '交易hash必须是字符串' })
  txID?: string;

  @ApiProperty({
    description: '发送地址（模糊搜索）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: '发送地址必须是字符串' })
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
    description: '开始时间（Unix时间戳）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '开始时间必须是整数' })
  @Min(0, { message: '开始时间必须大于等于0' })
  startAt?: number;

  @ApiProperty({
    description: '结束时间（Unix时间戳）',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '结束时间必须是整数' })
  @Min(0, { message: '结束时间必须大于等于0' })
  endAt?: number;
}
