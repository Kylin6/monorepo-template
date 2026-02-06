import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CaptchaResponseDto } from './dto/captcha.dto';
import { TwoStepVerifyDto } from './dto/two-step-verify.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Get('captcha')
  @ApiOperation({ summary: '获取验证码' })
  getCaptcha(): CaptchaResponseDto {
    const { session, captchaImage, code } =
      this.captchaService.generateCaptcha();

    // 开发环境返回验证码答案，生产环境不返回
    if (process.env.NODE_ENV === 'development') {
      console.log(`验证码 [${session}]: ${code}`);
    }

    return {
      session,
      captchaImage,
      expiresIn: 300, // 5分钟
    };
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('verify-google-auth')
  @ApiOperation({ summary: '二次认证验证' })
  async verifyTwoStep(
    @Body() verifyDto: TwoStepVerifyDto,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyTwoStepLogin(verifyDto);
  }
}
