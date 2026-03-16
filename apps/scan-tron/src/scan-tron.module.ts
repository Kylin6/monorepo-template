import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TronScannerService } from "./tron-scanner.service";
import { TronApiClient } from "./tron-api.client";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [TronScannerService, TronApiClient],
})
export class ScanTronModule {}
