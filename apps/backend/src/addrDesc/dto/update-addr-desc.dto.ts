import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength } from "class-validator";

/**
 * 编辑地址描述 DTO（按地址更新描述）
 */
export class UpdateAddrDescDto {
  @ApiProperty({ description: "地址（34 位）" })
  @IsString()
  @MaxLength(34)
  addr!: string;

  @ApiProperty({ description: "描述", required: false })
  @IsOptional()
  @IsString()
  desc?: string;
}
