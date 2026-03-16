import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ResourcePrice } from "@database/index";
import { ResourcePriceController } from "./resourcePrice.controller";
import { ResourcePriceService } from "./resourcePrice.service";

@Module({
  imports: [TypeOrmModule.forFeature([ResourcePrice])],
  controllers: [ResourcePriceController],
  providers: [ResourcePriceService],
  exports: [ResourcePriceService],
})
export class ResourcePriceModule {}
