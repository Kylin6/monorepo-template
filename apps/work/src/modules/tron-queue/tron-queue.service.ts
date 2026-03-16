import { Injectable } from "@nestjs/common";
import { Queue, type JobsOptions } from "bullmq";
import { loadConfig } from "@config/index";
import { QUEUE_NAMES } from "@common/index";
import type { TronDelegateJobData, TronReclaimJobData } from "@common/index";

@Injectable()
export class TronQueueService {
  private readonly delegateQueue: Queue<TronDelegateJobData>;
  private readonly reclaimQueue: Queue<TronReclaimJobData>;

  constructor() {
    const cfg = loadConfig();
    const connection = {
      host: cfg.REDIS_HOST,
      port: cfg.REDIS_PORT,
      db: cfg.QUEUE_REDIS_DB ?? 0,
    };

    this.delegateQueue = new Queue<TronDelegateJobData>(
      QUEUE_NAMES.TRON_DELEGATE,
      {
        connection,
      }
    );
    this.reclaimQueue = new Queue<TronReclaimJobData>(
      QUEUE_NAMES.TRON_RECLAIM,
      {
        connection,
      }
    );
  }

  /** 发起资源派发任务（键：tron-delegate，值：TronDelegateJobData） */
  enqueueDelegate(data: TronDelegateJobData, options?: JobsOptions) {
    return this.delegateQueue.add("default", data, {
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }

  /** 发起资源回收任务（键：tron-reclaim，值：TronReclaimJobData） */
  enqueueReclaim(data: TronReclaimJobData, options?: JobsOptions) {
    return this.reclaimQueue.add("default", data, {
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }
}
