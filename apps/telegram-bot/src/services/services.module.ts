import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { TaskService } from "./task.service";
import { SysCfgService } from "./syscfg.service";
import { OrderService } from "./order.service";
import { RechargeService } from "./recharge.service";
import { TronService } from "./tron.service";

/**
 * Services 模块
 * 放置可复用的业务服务（供 Commands/Handlers 注入）
 */
@Module({
  providers: [
    UserService,
    TaskService,
    SysCfgService,
    OrderService,
    RechargeService,
    TronService,
  ],
  exports: [
    UserService,
    TaskService,
    SysCfgService,
    OrderService,
    RechargeService,
    TronService,
  ],
})
export class ServicesModule {}
