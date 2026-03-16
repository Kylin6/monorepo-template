import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { Transform } from "class-transformer";

export class SwitchPlan2Dto {
  @ApiProperty({ description: "能量池地址", example: "T..." })
  @IsString({ message: "energyPoolAddr 必须是字符串" })
  energyPoolAddr: string;

  @ApiProperty({ description: "能量池数量（TRX）", example: 1000000 })
  @Transform(({ value }) => Number(value))
  @IsInt({ message: "energyPoolAmount 必须是整数" })
  @Min(1, { message: "energyPoolAmount 必须大于 0" })
  energyPoolAmount: number;

  @ApiProperty({ description: "能量触发阈值（可选）", required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ""
      ? undefined
      : Number(value)
  )
  @IsInt({ message: "energyTrigger 必须是整数" })
  energyTrigger?: number;

  @ApiProperty({ description: "能量补充数量（可选）", required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ""
      ? undefined
      : Number(value)
  )
  @IsInt({ message: "energySupply 必须是整数" })
  energySupply?: number;

  @ApiProperty({
    description: "带宽池地址（withBandwidth=10 时必填）",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "netPoolAddr 必须是字符串" })
  netPoolAddr?: string;

  @ApiProperty({
    description: "带宽池数量（TRX）（withBandwidth=10 时必填）",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ""
      ? undefined
      : Number(value)
  )
  @IsInt({ message: "netPoolAmount 必须是整数" })
  netPoolAmount?: number;

  @ApiProperty({ description: "带宽触发阈值（可选）", required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ""
      ? undefined
      : Number(value)
  )
  @IsInt({ message: "netTrigger 必须是整数" })
  netTrigger?: number;

  @ApiProperty({ description: "带宽补充数量（可选）", required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ""
      ? undefined
      : Number(value)
  )
  @IsInt({ message: "netSupply 必须是整数" })
  netSupply?: number;
}

