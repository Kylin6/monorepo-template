import { Module } from "@nestjs/common";
import { WatchExchangeWorker } from "./watch-exchange.worker";
import { WatchExchangeProcessor } from "./watch-exchange.processor";
import { TronResourceModule } from "../../services/tron-resource";

@Module({
  imports: [TronResourceModule],
  providers: [WatchExchangeWorker, WatchExchangeProcessor],
})
export class WatchExchangeModule {}
