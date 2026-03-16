import { Module } from "@nestjs/common";
import { SyncPlanTransactionWorker } from "./sync-plan-transaction.worker";
import { SyncPlanTransactionProcessor } from "./sync-plan-transaction.processor";
import { TronResourceModule } from "../../services/tron-resource/tron-resource.module";

@Module({
  imports: [TronResourceModule],
  providers: [SyncPlanTransactionWorker, SyncPlanTransactionProcessor],
})
export class SyncPlanTransactionModule {}

