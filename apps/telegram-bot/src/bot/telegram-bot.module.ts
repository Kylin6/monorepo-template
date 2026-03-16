import { Module } from "@nestjs/common";
import { TelegramBotService } from "./telegram-bot.service";
import { CommandsModule } from "../commands/commands.module";
import { HandlersModule } from "../handlers/handlers.module";
import { ServicesModule } from "../services/services.module";

/**
 * Telegram Bot 模块
 * 统一管理所有 Bot 相关的功能
 */
@Module({
  imports: [ServicesModule, CommandsModule, HandlersModule],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
