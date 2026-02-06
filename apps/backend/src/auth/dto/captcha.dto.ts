import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * 获取验证码请求 DTO
 */
export class GetCaptchaDto {
  @ApiProperty({
    description: "用户名",
    example: "admin",
  })
  @IsString()
  username!: string;
}

/**
 * 验证码响应 DTO
 */
export class CaptchaResponseDto {
  @ApiProperty({
    description: "验证码ID",
    example: "abc123def456",
  })
  session!: string;

  @ApiProperty({
    description: "验证码图片（Base64编码）",
    example: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0i...",
  })
  captchaImage!: string;

  @ApiProperty({
    description: "过期时间（秒）",
    example: 300,
  })
  expiresIn!: number;
}
