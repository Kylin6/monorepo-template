import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LeasePlanController } from "./leasePlan.controller";
import { LeasePlanService } from "./leasePlan.service";
import { LeasePlan, LeaseRecords, User } from "@database/index";
import { PlanLog } from "@database/entities/entities/PlanLog";

@Module({
  imports: [TypeOrmModule.forFeature([LeasePlan, LeaseRecords, User, PlanLog])],
  controllers: [LeasePlanController],
  providers: [LeasePlanService],
  exports: [LeasePlanService],
})
export class LeasePlanModule {}
