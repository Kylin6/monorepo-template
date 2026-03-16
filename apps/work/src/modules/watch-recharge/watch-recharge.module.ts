import { Module } from "@nestjs/common";
import { WatchRechargeWorker } from "./watch-recharge.worker";

@Module({
  providers: [WatchRechargeWorker],
})
export class WatchRechargeModule {}
