import { Module } from "@nestjs/common";
import { TelegramBotService } from "./telegram-bot.service";
import { CommandsModule } from "../commands/commands.module";
import { ServicesModule } from "../services/services.module";

@Module({
  imports: [ServicesModule, CommandsModule],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
