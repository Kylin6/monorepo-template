import { Module } from "@nestjs/common";
import { TronResourceModule } from "../../services/tron-resource";
import { TronQueueProcessor } from "./tron.processor";
import { TronQueueService } from "./tron-queue.service";

@Module({
  imports: [TronResourceModule],
  providers: [TronQueueService, TronQueueProcessor],
  exports: [TronQueueService],
})
export class TronQueueModule {}
