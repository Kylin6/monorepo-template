import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CaptchaService } from "./captcha.service";

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, CaptchaService],
  exports: [AuthService],
})
export class AuthModule {}
