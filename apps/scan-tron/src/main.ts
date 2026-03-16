import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { ScanTronModule } from "./scan-tron.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ScanTronModule);
  const logger = new Logger("ScanTronBootstrap");
  logger.log("Scan-TRON scanner service started");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Scan-TRON bootstrap error", err);
});
