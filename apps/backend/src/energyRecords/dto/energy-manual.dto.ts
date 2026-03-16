import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsEnum,
  Min,
  IsString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class EnergyManualDto {
  @ApiProperty({
    description: '发送地址',
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: '接收地址',
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: '数量',
  })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  amount: number;

  @ApiProperty({
    description: '资源类型',
    enum: ['E', 'B'],
  })
  @IsEnum(['E', 'B'])
  type: 'E' | 'B';

  @ApiProperty({
    description: '操作类型',
    enum: ['delegate', 'reclaim'],
  })
  @IsEnum(['delegate', 'reclaim'])
  operate: 'delegate' | 'reclaim';

  @ApiProperty({
    description: '到期时间',
    example: 30,
  })
  @IsNumber()
  expire: number;

  @ApiProperty({
    description: '到期时间类型',
    enum: ['D', 'H', 'M'],
    example: 'D',
  })
  expireType: 'D' | 'H' | 'M';

  @ApiProperty({
    description: '备注',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  remark?: string;
}
