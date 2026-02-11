import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common';

/**
 * 用户搜索DTO
 */
export class UserSearchDto extends PaginationQueryDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '用户ID必须是整数' })
  id?: number;

  @ApiProperty({
    description: '用户名',
    example: 'john',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  name?: string;

  @ApiProperty({
    description: '创建时间起始（Unix时间戳）',
    example: 1700000000,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '创建时间起始必须是整数' })
  @Min(0, { message: '创建时间起始必须大于等于0' })
  startAt?: number;

  @ApiProperty({
    description: '创建时间结束（Unix时间戳）',
    example: 1700086400,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '创建时间结束必须是整数' })
  @Min(0, { message: '创建时间结束必须大于等于0' })
  endAt?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: '状态必须是整数' })
  status?: number;
}
