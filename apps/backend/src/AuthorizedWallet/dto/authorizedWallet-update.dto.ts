import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

export class AuthorizedWalletUpdateDto {
  @ApiProperty({
    description: '状态，10=正常，0=禁用',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiProperty({
    description: '锁定状态，10=锁定，0=无',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  lock?: number;

  @ApiProperty({
    description:
      '出售能量类型，数组：10=分钟/小时订单，20=按天订单，30=笔数套餐，40=托管，50=速冲',
    example: [10, 20, 30, 40, 50],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  allowExpire?: number[];

  @ApiProperty({
    description:
      '出售带宽类型，数组：10=分钟/小时订单，20=按天订单，30=笔数套餐，40=托管，50=速冲',
    example: [10, 20, 30, 40, 50],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  allowBandwidthExpire?: number[];

  @ApiProperty({ description: '备注', example: '备注信息', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
