import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, MaxLength } from "class-validator";

/**
 * 新增地址描述 DTO
 */
export class CreateAddrDescDto {
  @ApiProperty({ description: "地址（34 位，如 TRON 地址）" })
  @IsString()
  @MaxLength(34)
  addr!: string;

  @ApiProperty({ description: "描述", required: false })
  @IsOptional()
  @IsString()
  desc?: string;
}
