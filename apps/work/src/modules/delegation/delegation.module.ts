import { Module } from "@nestjs/common";
import { DelegationWorker } from "./delegation.worker";
import { DelegationProcessor } from "./delegation.processor";
import { TronResourceModule } from "../../services/tron-resource";

@Module({
  imports: [TronResourceModule],
  providers: [DelegationWorker, DelegationProcessor],
})
export class DelegationModule {}
