import { Module } from "@nestjs/common";
import { WatchResourceWorker } from "./watch-resource.worker";

@Module({
  providers: [WatchResourceWorker],
})
export class WatchResourceModule {}
