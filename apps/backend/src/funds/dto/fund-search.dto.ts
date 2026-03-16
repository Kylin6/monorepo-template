import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import { IsInt, IsOptional, IsIn, Min } from "class-validator";
import { PaginationQueryDto } from "../../common";

/**
 * 资金账变搜索 DTO，与 funds 表字段一致
 */
export class FundSearchDto extends PaginationQueryDto {
  @ApiProperty({ description: "用户ID", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt({ message: "用户ID必须是整数" })
  uid?: number;

  @ApiProperty({ description: "订单号", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt({ message: "订单号必须是整数" })
  orderId?: number;

  @ApiProperty({
    description: "类型（10: 充值, 20: 消费, 30: 提现, 40: 调账）",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt()
  type?: number;

  @ApiProperty({
    description: "分类（10: 买家, 20: 卖家, 30: 代理）",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : Number(value)))
  @IsInt()
  cate?: number;

  @ApiProperty({
    description: "币种（USDT, TRX）",
    enum: ["USDT", "TRX"],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsIn(["USDT", "TRX"], { message: "币种必须是 USDT 或 TRX" })
  currency?: "USDT" | "TRX";

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
