import { Module } from "@nestjs/common";
import { WatchPlanWorker } from "./watch-plan.worker";

@Module({
  providers: [WatchPlanWorker],
})
export class WatchPlanModule {}

