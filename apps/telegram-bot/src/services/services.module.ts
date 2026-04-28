import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { TronService } from "./tron.service";

/**
 * Services 模块
 * 放置可复用的业务服务（供 Commands/Handlers 注入）
 */
@Module({
  providers: [
    UserService,
    TronService,
  ],
  exports: [
    UserService,
    TronService,
  ],
})
export class ServicesModule {}
