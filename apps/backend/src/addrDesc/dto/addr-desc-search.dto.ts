import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

/**
 * 地址描述搜索 DTO（不分页，仅条件筛选）
 */
export class AddrDescSearchDto {
  @ApiProperty({ description: "地址（模糊）", required: false })
  @IsOptional()
  @IsString()
  addr?: string;

  @ApiProperty({ description: "创建时间起始（Unix 时间戳）", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  startAt?: number;

  @ApiProperty({ description: "创建时间结束（Unix 时间戳）", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  endAt?: number;
}
