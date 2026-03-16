import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common';

/**
 * 资金账变搜索DTO
 */
export class AuthorizedWalletSearchDto extends PaginationQueryDto {
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
    description: '类型',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '类型必须是整数' })
  type?: number;

  @ApiProperty({
    description: '钱包地址',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: '钱包地址必须是字符串' })
  addr?: string;

  @ApiProperty({
    description: '状态',
    example: '10',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '状态必须是整数' })
  status?: number;

  @ApiProperty({
    description: '锁定状态',
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '锁定状态必须是整数' })
  lock?: number;

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
