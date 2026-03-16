import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUser } from "@database/index";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CaptchaService } from "./captcha.service";

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  controllers: [AuthController],
  providers: [AuthService, CaptchaService],
  exports: [AuthService],
})
export class AuthModule {}
