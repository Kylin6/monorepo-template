import { Injectable } from "@nestjs/common";
import {
  addExampleJob,
  addTronDelegateJob,
  addTronReclaimJob,
} from "@queue/index";
import type { TronDelegateJobData, TronReclaimJobData } from "@common/index";
import { getRedisClient } from "@redis/index";

@Injectable()
export class AppService {
  getHello() {
    return { message: "Hello from backend API" };
  }

  async enqueueExampleJob(payload: Record<string, unknown>) {
    await addExampleJob(payload);
    return { ok: true };
  }

  async enqueueTronDelegateJob(payload: TronDelegateJobData) {
    await addTronDelegateJob(payload);
    return { ok: true };
  }

  async enqueueTronReclaimJob(payload: TronReclaimJobData) {
    await addTronReclaimJob(payload);
    return { ok: true };
  }

  async setRedisKey(key: string, value: unknown) {
    const client = await getRedisClient();
    const storedValue =
      typeof value === "string" ? value : JSON.stringify(value ?? null);
    await client.set(key, storedValue);
    return { key, value: storedValue };
  }
}
