import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizedWalletController } from './authorizedWallet.controller';
import { AuthorizedWalletService } from './authorizedWallet.service';
import { AuthorizedWallet } from '@database/index';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorizedWallet])],
  controllers: [AuthorizedWalletController],
  providers: [AuthorizedWalletService],
  exports: [AuthorizedWalletService],
})
export class AuthorizedWalletModule {}
