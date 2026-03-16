import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { Transform } from "class-transformer";

export class DeleteResourcePriceDto {
  @ApiProperty({ description: "资源价格 ID", example: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt({ message: "id 必须是整数" })
  @Min(1, { message: "id 必须大于 0" })
  id: number;
}

