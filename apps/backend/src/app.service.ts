import { Injectable } from '@nestjs/common';
import { addExampleJob } from '@queue/index';

@Injectable()
export class AppService {
  getHello() {
    return { message: 'Hello from backend API' };
  }

  async enqueueExampleJob(payload: Record<string, unknown>) {
    await addExampleJob(payload);
    return { ok: true };
  }
}

