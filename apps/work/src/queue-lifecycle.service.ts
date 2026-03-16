import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { closeAllSharedQueues } from "@queue/index";

@Injectable()
export class QueueLifecycleService implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string) {
    await closeAllSharedQueues();
  }
}
