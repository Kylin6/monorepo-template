import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * 分页查询DTO
 */
export class PaginationQueryDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为1' })
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为1' })
  @Max(100, { message: '每页数量最大为100' })
  pageSize?: number = 10;
}

/**
 * 分页信息
 */
export class PaginationMeta {
  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总记录数', example: 100 })
  total: number;

  @ApiProperty({ description: '总页数', example: 10 })
  totalPages: number;

  constructor(page: number, pageSize: number, total: number) {
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.totalPages = Math.ceil(total / pageSize);
  }
}

/**
 * 分页响应DTO
 */
export class PaginationResponseDto<T> {
  @ApiProperty({ description: '数据列表' })
  list: T[];

  @ApiProperty({ description: '分页信息', type: PaginationMeta })
  pagination: PaginationMeta;

  constructor(list: T[], page: number, pageSize: number, total: number) {
    this.list = list;
    this.pagination = new PaginationMeta(page, pageSize, total);
  }

  /**
   * 创建分页响应
   */
  static create<T>(
    list: T[],
    page: number,
    pageSize: number,
    total: number,
  ): PaginationResponseDto<T> {
    return new PaginationResponseDto(list, page, pageSize, total);
  }
}
