import { Controller, Post, Body, Get, Inject, Optional } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import {
  BaseController,
  CurrentUserInfo,
  OPERATION_LOGGER,
  IOperationLogger,
} from "@common/index";
import { AuthService } from "./auth.service";
import { CaptchaService } from "./captcha.service";
import { LoginDto } from "./dto/login.dto";
import { TwoStepVerifyDto } from "./dto/two-step-verify.dto";

@ApiTags("认证")
@Controller("auth")
export class AuthController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService
  ) {
    super(request, operationLogger);
  }

  @Get("captcha")
  @ApiOperation({ summary: "获取验证码" })
  getCaptcha() {
    const { session, captchaImage, code } =
      this.captchaService.generateCaptcha();

    if (process.env.NODE_ENV === "development") {
      console.log(`验证码 [${session}]: ${code}`);
    }

    return this.success({
      session,
      captchaImage,
      expiresIn: 300,
    });
  }

  @Post("login")
  @ApiOperation({ summary: "用户登录" })
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return this.success(data);
  }

  @Post("verify-google-auth")
  @ApiOperation({ summary: "二次认证验证" })
  async verifyTwoStep(@Body() verifyDto: TwoStepVerifyDto) {
    const data = await this.authService.verifyTwoStepLogin(verifyDto);
    return this.success(data);
  }
}
