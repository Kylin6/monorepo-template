import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log("Worker service started");

  // 这里不需要 HTTP 端口，仅作为队列 Worker 常驻进程
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Worker bootstrap error", err);
});
