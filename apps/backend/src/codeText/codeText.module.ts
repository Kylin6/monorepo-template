import { Module } from '@nestjs/common';
import { CodeTextController } from './codeText.controller';
import { CodeTextService } from './codeText.service';

@Module({
  controllers: [CodeTextController],
  providers: [CodeTextService],
  exports: [CodeTextService],
})
export class CodeTextModule {}
