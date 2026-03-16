import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  Matches,
  ValidateNested,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SysCfgFormDto {
  @ApiProperty({
    description: '配置名称',
    example: '联系我们',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: '配置分组',
    example: '系统配置',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  group?: string;

  @ApiProperty({
    description: '配置键（唯一）',
    example: 'contactUsEmail',
  })
  @IsString()
  @MaxLength(255)
  key: string;

  @ApiProperty({
    description: '配置值',
    example: 'suport@trxen.io',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @ValidateIf((o: SysCfgFormDto) => !Array.isArray(o.value))
  @IsString()
  @ValidateIf((o: SysCfgFormDto) => Array.isArray(o.value))
  @IsArray()
  value: string | string[];

  @ApiProperty({
    description:
      '（可选）前端用于提交数组值的字段，后端主要使用 value 字段，可安全忽略',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  valueArray?: string[];

  @ApiProperty({
    description: '验证规则',
    example: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rule?: string;

  @ApiProperty({
    description: '配置描述',
    example: '联系我们的系统邮箱',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  desc?: string;
}

export class SaveCfgDto {
  @ApiProperty({
    description: '系统配置表单',
    type: SysCfgFormDto,
  })
  @ValidateNested()
  @Type(() => SysCfgFormDto)
  SysCfgForm: SysCfgFormDto;

  @ApiProperty({
    description: 'Google Authenticator 六位验证码',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
  gcode?: string;
}
