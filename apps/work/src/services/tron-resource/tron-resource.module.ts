import { Module } from "@nestjs/common";
import { TronResourceService } from "./tron-resource.service";

@Module({
  providers: [TronResourceService],
  exports: [TronResourceService],
})
export class TronResourceModule {}
