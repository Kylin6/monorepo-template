import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // 这里不暴露 HTTP 接口，仅作为 Telegram 机器人常驻进程
  // 具体的 bot 初始化逻辑在 TelegramBotService 中完成
  // eslint-disable-next-line no-console
  console.log("Telegram bot service started");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Telegram bot bootstrap error", err);
});
