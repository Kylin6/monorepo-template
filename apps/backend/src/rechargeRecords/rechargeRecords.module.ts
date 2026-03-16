import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RechargeRecordsController } from './rechargeRecords.controller';
import { RechargeRecordsService } from './rechargeRecords.service';
import { RechargeRecords, User } from '@database/index';

@Module({
  imports: [TypeOrmModule.forFeature([RechargeRecords, User])],
  controllers: [RechargeRecordsController],
  providers: [RechargeRecordsService],
  exports: [RechargeRecordsService],
})
export class RechargeRecordsModule {}
