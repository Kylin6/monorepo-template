import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

/**
 * 调整用户余额 DTO，字段与业务一致
 */
export class UpdateBalanceDto {
  @ApiProperty({
    description: "变动金额（正数增加，负数减少，不能为 0）",
    example: 10.5,
  })
  @Type(() => Number)
  @IsNumber()
  change!: number;

  @ApiProperty({
    description: "备注说明",
    example: "后台调账",
    required: false,
  })
  @IsOptional()
  @IsString()
  remark?: string;
}
