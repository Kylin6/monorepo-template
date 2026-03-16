import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { QueueWorkerService } from "./services/worker.service";
import { TronBlockScannerWorker } from "./tron-block-scanner.worker";
import { DatabaseInitService } from "./services/database-init.service";
import { TronResourceModule } from "./services/tron-resource";
import { TronQueueModule } from "./modules/tron-queue/tron-queue.module";
import { DelegationModule } from "./modules/delegation/delegation.module";
import { UndelegationModule } from "./modules/undelegation/undelegation.module";
import { WatchResourceModule } from "./modules/watch-resource/watch-resource.module";
import { WatchRechargeModule } from "./modules/watch-recharge/watch-recharge.module";
import { WatchExchangeModule } from "./modules/watch-exchange/watch-exchange.module";
import { WatchPlanModule } from "./modules/watch-plan/watch-plan.module";
import { SyncPlanTransactionModule } from "./modules/sync-plan-transaction/sync-plan-transaction.module";
import { QueueLifecycleService } from "./queue-lifecycle.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    ScheduleModule.forRoot(),
    TronResourceModule,
    TronQueueModule,
    DelegationModule,
    UndelegationModule,
    WatchResourceModule,
    WatchRechargeModule,
    WatchExchangeModule,
    WatchPlanModule,
    SyncPlanTransactionModule,
  ],
  providers: [
    QueueWorkerService,
    DatabaseInitService,
    TronBlockScannerWorker,
    QueueLifecycleService,
  ],
})
export class AppModule {}
