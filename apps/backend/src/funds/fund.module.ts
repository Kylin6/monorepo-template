import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Funds, User } from "@database/index";
import { FundsController } from "./fund.controller";
import { FundsService } from "./fund.service";

@Module({
  imports: [TypeOrmModule.forFeature([Funds, User])],
  controllers: [FundsController],
  providers: [FundsService],
  exports: [FundsService],
})
export class FundsModule {}
