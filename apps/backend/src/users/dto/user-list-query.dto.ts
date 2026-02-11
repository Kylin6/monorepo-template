import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  Min,
  Max,
  IsString,
  MaxLength,
} from "class-validator";

/**
 * 用户列表查询 DTO：分页 + 搜索
 */
export class UserListQueryDto {
  @ApiProperty({
    description: "页码",
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "页码必须是整数" })
  @Min(1, { message: "页码最小为1" })
  page?: number = 1;

  @ApiProperty({
    description: "每页数量",
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "每页数量必须是整数" })
  @Min(1, { message: "每页数量最小为1" })
  @Max(100, { message: "每页数量最大为100" })
  pageSize?: number = 10;

  @ApiProperty({
    description: "搜索关键词（匹配 email 或 name）",
    example: "tom",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "关键词最长100字符" })
  keyword?: string;
}
