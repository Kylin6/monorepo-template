import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

export class TwoStepVerifyDto {
  @ApiProperty({
    description: "登录后返回的临时令牌",
    example: "d8f0b6e5a4c13c5d8f0b6e5a4c13c5d8",
  })
  @IsString()
  @Length(32, 64)
  tempToken!: string;

  @ApiProperty({
    description: "Google Authenticator 六位验证码",
    example: "123456",
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: "验证码必须为 6 位数字" })
  googleAuthCode!: string;
}
