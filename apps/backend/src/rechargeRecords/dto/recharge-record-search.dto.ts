import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, IsEnum, Min } from "class-validator";
import { PaginationQueryDto } from "../../common";

/**
 * 充值记录搜索DTO
 */
export class RechargeRecordSearchDto extends PaginationQueryDto {
  @ApiProperty({
    description: "用户ID",
    // example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt({ message: "用户ID必须是整数" })
  uid?: number;

  @ApiProperty({
    description: "代理Id",
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt({ message: "代理Id必须是整数" })
  agentId?: number;

  @ApiProperty({
    description: "交易hash",
    // example: 'abc123...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "交易hash必须是字符串" })
  txId?: string;

  // 兼容老参数名 txID（只做校验，不直接在查询中使用）
  @ApiProperty({
    description: "交易hash（兼容参数名 txID）",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "交易hash必须是字符串" })
  txID?: string;

  @ApiProperty({
    description: "转账地址（模糊搜索）",
    // example: 'TRX...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "转账地址必须是字符串" })
  fromAddr?: string;

  @ApiProperty({
    description: "接收地址（模糊搜索）",
    // example: 'TRX...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "接收地址必须是字符串" })
  toAddr?: string;

  @ApiProperty({
    description: "币种类型（USDT, TRX）",
    example: "",
    enum: ["USDT", "TRX"],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsEnum(["USDT", "TRX"], { message: "币种类型必须是 USDT 或 TRX" })
  type?: "USDT" | "TRX";

  @ApiProperty({
    description: "分类（10: 用户充值, 20: 代理充值）",
    example: "",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt({ message: "分类必须是整数" })
  cate?: number;

  @ApiProperty({
    description: "创建时间起始（Unix时间戳）",
    // example: 1700000000,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt({ message: "创建时间起始必须是整数" })
  @Min(0, { message: "创建时间起始必须大于等于0" })
  startAt?: number;

  @ApiProperty({
    description: "创建时间结束（Unix时间戳）",
    // example: 1700086400,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt({ message: "创建时间结束必须是整数" })
  @Min(0, { message: "创建时间结束必须大于等于0" })
  endAt?: number;
}
