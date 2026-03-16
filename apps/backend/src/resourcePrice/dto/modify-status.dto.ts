import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { Transform } from "class-transformer";

export class ModifyStatusDto {
  @ApiProperty({ description: "资源价格 ID", example: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt({ message: "id 必须是整数" })
  @Min(1, { message: "id 必须大于 0" })
  id: number;

  @ApiProperty({ description: "状态（10 启用，0 停用）", example: 10 })
  @Transform(({ value }) => Number(value))
  @IsInt({ message: "status 必须是整数" })
  status: number;
}

