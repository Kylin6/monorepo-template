import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EnergyRecords, LeaseRecords } from "@database/index";
import { EnergyRecordsController } from "./energyRecords.controller";
import { EnergyRecordsService } from "./energyRecords.service";
import { DatabaseServicesModule } from "../database/database-services.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyRecords, LeaseRecords]),
    DatabaseServicesModule,
  ],
  controllers: [EnergyRecordsController],
  providers: [EnergyRecordsService],
  exports: [EnergyRecordsService],
})
export class EnergyRecordsModule {}
