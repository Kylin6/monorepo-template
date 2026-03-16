import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExchangeController } from "./exchage.controller";
import { ExchangeService } from "./exchage.service";
import { Exchange } from "@database/index";

@Module({
  imports: [TypeOrmModule.forFeature([Exchange])],
  controllers: [ExchangeController],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
