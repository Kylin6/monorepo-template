import { Queue, Worker, JobsOptions, type QueueOptions } from "bullmq";
import { loadConfig } from "@config/index";
import {
  QUEUE_NAMES,
  type TronDelegateJobData,
  type TronReclaimJobData,
} from "@common/index";

// 进程级 Queue 缓存：同一个 queueKey 只创建一个 Queue 实例
const sharedQueues = new Map<string, Queue>();

/** 统一获取 BullMQ 队列的 Redis 连接配置 */
export function getQueueConnection(): QueueOptions["connection"] {
  const cfg = loadConfig();
  return {
    host: cfg.REDIS_HOST,
    port: cfg.REDIS_PORT,
    db: cfg.QUEUE_REDIS_DB ?? 0,
  };
}

function getSharedQueue(name: string): Queue {
  let q = sharedQueues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: getQueueConnection(),
    });
    sharedQueues.set(name, q);
  }
  return q;
}

export async function closeAllSharedQueues(): Promise<void> {
  const all = Array.from(sharedQueues.values());
  sharedQueues.clear();
  await Promise.allSettled(all.map((q) => q.close()));
}

/**
 * 通用投递队列任务（复用进程级 Queue，不在每次投递后关闭）
 *
 * 适用场景：
 * - 项目启动后常驻的 worker / bot / 后台服务
 * - 偶发或频繁投递都可复用同一个 Queue 连接
 *
 * 若需要在优雅退出时关闭连接，可调用 closeAllSharedQueues。
 */
export async function sendQueueJob<T extends Record<string, unknown>>(
  queueKey: string,
  payload: T,
  jobName = "default",
  options?: JobsOptions
): Promise<void> {
  const queue = getSharedQueue(queueKey);
  const finalOptions: JobsOptions = {
    ...options,
    removeOnComplete: options?.removeOnComplete ?? true,
    removeOnFail: options?.removeOnFail ?? false,
  };
  await queue.add(jobName, payload, finalOptions);
}

export async function getExampleQueue(): Promise<Queue> {
  return new Queue(QUEUE_NAMES.EXAMPLE, {
    connection: getQueueConnection(),
  });
}

export async function addExampleJob(
  data: Record<string, unknown>,
  options?: JobsOptions
) {
  const queue = await getExampleQueue();
  return queue.add("default", data, options);
}

export async function createQueueWorker() {
  const worker = new Worker(
    QUEUE_NAMES.EXAMPLE,
    async (job) => {
      // 在这里处理队列任务
      // eslint-disable-next-line no-console
      console.log("Processing job", job.name, job.id, job.data);
    },
    {
      connection: getQueueConnection(),
    }
  );

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error("Job failed", job?.id, err);
  });

  return worker;
}

// ================= Tron 队列：资源派发 / 回收 =================

export async function getTronDelegateQueue(): Promise<
  Queue<TronDelegateJobData>
> {
  return new Queue<TronDelegateJobData>(QUEUE_NAMES.TRON_DELEGATE, {
    connection: getQueueConnection(),
  });
}

export async function addTronDelegateJob(
  data: TronDelegateJobData,
  options?: JobsOptions
) {
  const queue = await getTronDelegateQueue();
  return queue.add("default", data, {
    ...options,
    removeOnComplete: true,
    removeOnFail: false,
  });
}

export async function getTronReclaimQueue(): Promise<
  Queue<TronReclaimJobData>
> {
  return new Queue<TronReclaimJobData>(QUEUE_NAMES.TRON_RECLAIM, {
    connection: getQueueConnection(),
  });
}

export async function addTronReclaimJob(
  data: TronReclaimJobData,
  options?: JobsOptions
) {
  const queue = await getTronReclaimQueue();
  return queue.add("default", data, {
    ...options,
    removeOnComplete: true,
    removeOnFail: false,
  });
}
