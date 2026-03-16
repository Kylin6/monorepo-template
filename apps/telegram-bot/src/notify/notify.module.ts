import { Module } from "@nestjs/common";
import { TelegramBotModule } from "../bot/telegram-bot.module";
import { RechargeNotifyProcessor } from "./recharge-notify.processor";
import { DurationOrderNotifyProcessor } from "./duration-order-notify.processor";

@Module({
  imports: [TelegramBotModule],
  providers: [RechargeNotifyProcessor, DurationOrderNotifyProcessor],
})
export class NotifyModule {}
