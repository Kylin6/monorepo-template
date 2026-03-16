import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class EditPlan2Dto {
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

