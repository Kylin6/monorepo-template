import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: "用户名",
    example: "admin",
  })
  @IsString()
  username!: string;

  @ApiProperty({
    description: "密码",
    example: "password123",
  })
  @IsString({ message: "密码必须是字符串" })
  @MinLength(6, { message: "密码至少需要6个字符" })
  password!: string;

  @ApiProperty({
    description: "验证码ID",
    example: "abc123def456",
  })
  @IsString({ message: "验证码ID必须是字符串" })
  session!: string;

  @ApiProperty({
    description: "验证码",
    example: "A1B2",
  })
  @IsString({ message: "验证码必须是字符串" })
  @MinLength(4, { message: "验证码长度不正确" })
  captcha!: string;
}
