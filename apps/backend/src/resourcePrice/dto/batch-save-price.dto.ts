import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ResourcePriceItemDto {
  @ApiProperty({
    description: '资源类型',
    example: 'E',
    enum: ['B', 'E'],
  })
  @IsEnum(['B', 'E'])
  type: 'B' | 'E';

  @ApiProperty({
    description: '过期时间数值',
    example: 1,
  })
  @IsNumber()
  expire: number;

  @ApiProperty({
    description: '过期时间类型',
    example: 'D',
    enum: ['D', 'H', 'M'],
  })
  @IsEnum(['D', 'H', 'M'])
  expireType: 'D' | 'H' | 'M';

  @ApiProperty({
    description: '价格',
    example: '100',
  })
  @IsString()
  price: string;

  // @ApiProperty({
  //   description: '进价',
  //   example: '100',
  // })
  // @IsString()
  // inPrice: string;

  @ApiProperty({
    description: '状态',
    example: 10,
  })
  @IsNumber()
  status: number;
}

export class BatchSavePriceDto {
  @ApiProperty({
    description: '资源价格数组',
    type: [ResourcePriceItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ResourcePriceItemDto)
  items: ResourcePriceItemDto[];
}
