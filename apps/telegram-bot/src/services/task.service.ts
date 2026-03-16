import { Injectable } from "@nestjs/common";

export interface ChatTask<T = any> {
  name: string;
  data?: T;
  createdAt: number;
}

/** 待支付订单数据（用于 callback_data 超长时临时存储，避免超过 64 字节限制） */
export interface PendingOrderData {
  expire: number;
  expireType: "D" | "H" | "M";
  count: number;
  totalEnergy: number;
  targetAddr: string;
  energyPerCount: number;
}

@Injectable()
export class TaskService {
  private readonly tasks = new Map<number, ChatTask>();
  private readonly pendingOrders = new Map<string, PendingOrderData>();

  setTask<T = any>(chatId: number, name: string, data?: T) {
    this.tasks.set(chatId, { name, data, createdAt: Date.now() });
  }

  clearTask(chatId: number) {
    this.tasks.delete(chatId);
  }

  hasTask(chatId: number): boolean {
    return this.tasks.has(chatId);
  }

  getTask<T = any>(chatId: number): ChatTask<T> | undefined {
    return this.tasks.get(chatId) as ChatTask<T> | undefined;
  }

  /** 生成短 key 并存储待支付订单，用于 callback_data 不超过 64 字节 */
  setPendingOrder(data: PendingOrderData): string {
    const key = Math.random().toString(36).slice(2, 10);
    this.pendingOrders.set(key, data);
    return key;
  }

  getAndClearPendingOrder(key: string): PendingOrderData | undefined {
    const data = this.pendingOrders.get(key);
    this.pendingOrders.delete(key);
    return data;
  }
}
