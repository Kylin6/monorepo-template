import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddrDescController } from './addrDesc.controller';
import { AddrDescService } from './addrDesc.service';
import { AddrDesc } from '@database/index';

@Module({
  imports: [TypeOrmModule.forFeature([AddrDesc])],
  controllers: [AddrDescController],
  providers: [AddrDescService],
  exports: [AddrDescService],
})
export class AddrDescModule {}
