import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  IsIn,
  Min,
} from "class-validator";

/**
 * 编辑用户 DTO，仅包含可编辑字段（与 users 表字段对应）
 */
export class EditUserDto {
  @ApiProperty({ description: "用户名", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string | null;

  @ApiProperty({ description: "昵称", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nickname?: string | null;

  @ApiProperty({ description: "邮箱", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({ description: "手机号", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  mobile?: string | null;

  @ApiProperty({ description: "TRON 钱包地址（34 位）", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  walletAddr?: string | null;

  @ApiProperty({ description: "Telegram ID", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  telegramId?: string | null;

  @ApiProperty({ description: "Telegram 用户名", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telegramUsername?: string | null;

  @ApiProperty({ description: "Telegram 昵称", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telegramNickname?: string | null;

  @ApiProperty({ description: "备注", required: false })
  @IsOptional()
  @IsString()
  remark?: string | null;

  @ApiProperty({
    description: "类型：0 普通 10 卖家",
    required: false,
    enum: [0, 10],
  })
  @IsOptional()
  @IsNumber()
  @IsIn([0, 10])
  type?: number;

  @ApiProperty({ description: "状态：10 正常 等", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  status?: number;

  @ApiProperty({ description: "时长能量价格浮动", required: false })
  @IsOptional()
  @IsNumber()
  energyPriceFloat?: number;

  @ApiProperty({ description: "时长带宽价格浮动", required: false })
  @IsOptional()
  @IsNumber()
  netPriceFloat?: number;

  @ApiProperty({ description: "托管能量价格浮动", required: false })
  @IsOptional()
  @IsNumber()
  planEnergyPriceFloat?: number;

  @ApiProperty({ description: "托管带宽价格浮动", required: false })
  @IsOptional()
  @IsNumber()
  planNetPriceFloat?: number;

  @ApiProperty({ description: "闪充能量价格浮动", required: false })
  @IsOptional()
  @IsNumber()
  fastEnergyPriceFloat?: number;

  @ApiProperty({ description: "闪充带宽价格浮动", required: false })
  @IsOptional()
  @IsNumber()
  fastNetPriceFloat?: number;
}
