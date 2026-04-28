import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TelegramBotModule } from "./bot/telegram-bot.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    TelegramBotModule,
  ]
})
export class AppModule {}
