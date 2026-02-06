import { Queue, Worker, JobsOptions } from 'bullmq';
import { loadConfig } from '@config/index';
import { QUEUE_NAMES } from '@common/index';

export async function getExampleQueue(): Promise<Queue> {
  const cfg = loadConfig();
  return new Queue(QUEUE_NAMES.EXAMPLE, {
    connection: {
      host: cfg.REDIS_HOST,
      port: cfg.REDIS_PORT,
      db: cfg.QUEUE_REDIS_DB ?? 0,
    },
  });
}

export async function addExampleJob(
  data: Record<string, unknown>,
  options?: JobsOptions,
) {
  const queue = await getExampleQueue();
  return queue.add('default', data, options);
}

export async function createQueueWorker() {
  const cfg = loadConfig();
  const worker = new Worker(
    QUEUE_NAMES.EXAMPLE,
    async (job) => {
      // 在这里处理队列任务
      // eslint-disable-next-line no-console
      console.log('Processing job', job.name, job.id, job.data);
    },
    {
      connection: {
        host: cfg.REDIS_HOST,
        port: cfg.REDIS_PORT,
        db: cfg.QUEUE_REDIS_DB ?? 0,
      },
    },
  );

  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error('Job failed', job?.id, err);
  });

  return worker;
}

