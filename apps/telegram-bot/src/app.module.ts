import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TelegramBotModule } from "./bot/telegram-bot.module";
import { InfraModule } from "./infra/infra.module";
import { QueueLifecycleService } from "./queue-lifecycle.service";
import { NotifyModule } from "./notify/notify.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    InfraModule,
    TelegramBotModule,
    NotifyModule,
  ],
  providers: [QueueLifecycleService],
})
export class AppModule {}
