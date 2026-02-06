import { Injectable, OnModuleInit } from '@nestjs/common';
import { createQueueWorker } from '@queue/index';

@Injectable()
export class QueueWorkerService implements OnModuleInit {
  async onModuleInit() {
    // 启动队列 Worker
    await createQueueWorker();
  }
}

