import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LeaseRecordController } from "./leaseRecord.controller";
import { LeaseRecordService } from "./leaseRecord.service";
import {
  LeaseRecords,
  User,
  Agent,
  Funds,
  EnergyRecords,
  AuthorizedWallet,
} from "@database/index";
import { DatabaseServicesModule } from "../database/database-services.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaseRecords,
      User,
      Agent,
      Funds,
      EnergyRecords,
      AuthorizedWallet,
    ]),
    DatabaseServicesModule,
  ],
  controllers: [LeaseRecordController],
  providers: [LeaseRecordService],
  exports: [LeaseRecordService],
})
export class LeaseRecordModule {}
