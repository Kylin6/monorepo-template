import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { closeAllSharedQueues } from "@queue/index";

@Injectable()
export class QueueLifecycleService implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string) {
    // 可以根据需要使用 signal 做额外的日志或处理
    await closeAllSharedQueues();
  }
}
