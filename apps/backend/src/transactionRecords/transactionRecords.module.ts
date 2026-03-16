import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionRecordsController } from "./transactionRecords.controller";
import { TransactionRecordsService } from "./transactionRecords.service";
import { TransactionRecords } from "@database/index";

@Module({
  imports: [TypeOrmModule.forFeature([TransactionRecords])],
  controllers: [TransactionRecordsController],
  providers: [TransactionRecordsService],
  exports: [TransactionRecordsService],
})
export class TransactionRecordsModule {}
