import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueWorkerService } from './worker.service';
import { DatabaseInitService } from './database-init.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
  ],
  providers: [QueueWorkerService, DatabaseInitService],
})
export class WorkerModule {}

