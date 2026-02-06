import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名至少需要2个字符' })
  @MaxLength(50, { message: '用户名不能超过50个字符' })
  name: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(100, { message: '密码不能超过100个字符' })
  password: string;

  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  avatar?: string;
}
