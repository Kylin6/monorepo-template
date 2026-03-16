import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SysCfg } from "@database/index";
import { AuthModule } from "../auth/auth.module";
import { SysCfgController } from "./sysCfg.controller";
import { SysCfgService } from "./sysCfg.service";

@Module({
  imports: [TypeOrmModule.forFeature([SysCfg]), AuthModule],
  controllers: [SysCfgController],
  providers: [SysCfgService],
  exports: [SysCfgService],
})
export class SysCfgModule {}
