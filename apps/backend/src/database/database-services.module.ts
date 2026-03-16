import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UniqueId } from "@database/index";
import { UniqueIdService } from "./unique-id.service";

@Module({
  imports: [TypeOrmModule.forFeature([UniqueId])],
  providers: [UniqueIdService],
  exports: [UniqueIdService],
})
export class DatabaseServicesModule {}
