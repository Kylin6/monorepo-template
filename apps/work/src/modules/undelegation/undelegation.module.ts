import { Module } from "@nestjs/common";
import { UndelegationWorker } from "./undelegation.worker";
import { UndelegationProcessor } from "./undelegation.processor";
import { TronResourceModule } from "../../services/tron-resource";

@Module({
  imports: [TronResourceModule],
  providers: [UndelegationWorker, UndelegationProcessor],
})
export class UndelegationModule {}
