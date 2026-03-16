import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import type { RedisClientType } from "redis";
import { getRedisClient } from "@redis/index";

import { TronApiClient, TronBlock } from "./tron-api.client";

/**
 * Tron 区块扫描服务（无数据库版）
 *
 * - 周期性从 TRON 节点拉取最新区块
 * - 通过 NATS 将当前区块原始数据推送给订阅者
 *
 * 环境变量：
 * - TRON_NODE_URL          Tron 节点地址（由 TronApiClient 使用）
 * - NATS_URL               NATS 服务器地址，默认 nats://localhost:4222
 * - TRON_BLOCK_TOPIC       推送区块的 NATS 主题，默认 tron.block.latest
 *
 * Redis 依赖（使用 libs/redis）：
 * - 用于记录已成功处理的区块号，以及维护待补偿区块集合
 */
@Injectable()
export class TronScannerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TronScannerService.name);
  private natsClient: ClientProxy;
  private readonly topic: string;
  private redisClient: RedisClientType | null = null;

  // 区块检查窗口相关
  private nowBlock = 0;
  private deadBlock = 0;
  // 记录已成功处理区块的 key 前缀
  private readonly KEY_BLOCK_SUCCEED_PREFIX = "tron:block:succeed:";
  // 待补偿区块集合 key
  private readonly KEY_PENDING_QUERY = "tron:block:pending:query";

  constructor(
    private readonly tronApiClient: TronApiClient,
    private readonly configService: ConfigService
  ) {
    const natsUrl =
      this.configService.get<string>("NATS_URL") || "nats://localhost:4222";

    this.topic =
      this.configService.get<string>("TRON_BLOCK_TOPIC") || "tron.block.latest";

    this.logger.log(`使用 NATS 服务器: ${natsUrl}`);
    this.logger.log(`区块推送主题: ${this.topic}`);

    this.natsClient = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
      },
    });
  }

  async onModuleInit() {
    // 连接 NATS
    await this.natsClient.connect();
    this.logger.log("TRON 扫描器已启动并成功连接到 NATS。");

    // 连接 Redis（用于区块补偿机制）
    try {
      this.redisClient = await getRedisClient();
      this.logger.log("Redis 已连接，用于记录区块处理状态。");
    } catch (error) {
      this.logger.error(
        `连接 Redis 失败，将无法使用历史区块补偿机制: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      this.redisClient = null;
    }
  }

  async onModuleDestroy() {
    if (this.natsClient) {
      await this.natsClient.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  /**
   * 每 3 秒拉取最新区块并通过 NATS 推送
   */
  @Cron("*/3 * * * * *")
  async scanLatestBlock() {
    try {
      const block = await this.tronApiClient.getNowBlock();
      const blockData = block.block_header.raw_data;

      this.nowBlock = blockData.number;
      // Tron 区块约 3 秒一个，这里按 15 秒窗口计算 deadBlock
      this.deadBlock = this.nowBlock - 5;

      // 推送区块
      await this.publishBlock(block);

      // 标记当前区块已成功推送
      await this.setBlockSucceed(this.nowBlock);
    } catch (error) {
      this.logger.error(
        `扫描或推送最新区块失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 将区块推送到 NATS
   */
  private async publishBlock(block: TronBlock) {
    try {
      const blockNumber = block.block_header.raw_data.number;
      const payload = this.compactBlock(block);
      await lastValueFrom(this.natsClient.emit(this.topic, payload));
      // this.logger.debug(`已推送区块 ${blockNumber} 到 NATS 主题 ${this.topic}`);
    } catch (error) {
      this.logger.error(
        `推送区块到 NATS 失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * NATS 默认 max_payload 较小（常见约 1MB），Tron 原始区块字段（如 signature 等）
   * 可能导致消息过大。这里将区块裁剪为 worker 处理所需的最小字段集合。
   */
  private compactBlock(block: TronBlock): TronBlock {
    const headerRaw = block?.block_header?.raw_data;
    const txs = Array.isArray(block?.transactions) ? block.transactions : [];

    return {
      block_header: {
        raw_data: headerRaw,
      },
      transactions: txs.map((tx) => {
        const raw = (tx as any)?.raw_data ?? {};
        const contracts = Array.isArray(raw?.contract) ? raw.contract : [];
        return {
          txID: (tx as any)?.txID,
          ret: (tx as any)?.ret,
          raw_data: {
            timestamp: raw?.timestamp,
            contract: contracts.map((c: any) => ({
              type: c?.type,
              parameter: {
                value: c?.parameter?.value,
              },
            })),
          },
        } as any;
      }),
    };
  }

  /**
   * 标记区块已成功处理（仅在 Redis 可用时记录）
   */
  private async setBlockSucceed(blockNum: number): Promise<void> {
    if (!this.redisClient) return;
    const key = `${this.KEY_BLOCK_SUCCEED_PREFIX}${blockNum}`;
    // 保留一段时间即可，这里给 1 小时 TTL
    const ttlSeconds = 3600;
    await this.redisClient.set(key, Date.now().toString(), {
      EX: ttlSeconds,
    });
  }

  /**
   * 检查区块是否已成功处理
   */
  private async isBlockSucceed(blockNum: number): Promise<boolean> {
    if (!this.redisClient) return false;
    const key = `${this.KEY_BLOCK_SUCCEED_PREFIX}${blockNum}`;
    const value = await this.redisClient.get(key);
    return value !== null;
  }

  /**
   * 每 15 秒检查历史区块是否都已同步
   * 将缺失的区块号加入待补偿集合
   */
  @Cron("*/15 * * * * *")
  async checkHistoricalBlocks() {
    if (!this.redisClient) {
      return;
    }

    try {
      if (this.deadBlock > 0 && this.nowBlock > 0) {
        let start = this.nowBlock;
        while (start > this.deadBlock) {
          const isSucceed = await this.isBlockSucceed(start);
          if (!isSucceed) {
            await this.redisClient.sAdd(
              this.KEY_PENDING_QUERY,
              start.toString()
            );
          }
          start--;
        }
      }
    } catch (error) {
      this.logger.error(
        `检查历史区块失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 每 15 秒检查待同步区块数量，如果超过阈值则告警
   */
  @Cron("*/15 * * * * *")
  async checkPendingBlocksCount() {
    if (!this.redisClient) {
      return;
    }

    try {
      const count = await this.redisClient.sCard(this.KEY_PENDING_QUERY);
      if (count > 10) {
        this.logger.warn(`系统异常：待同步的区块数量: ${count} 个`);
      }
    } catch (error) {
      this.logger.error(
        `检查待同步区块数量失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 每 5 秒处理待同步的区块
   */
  @Cron("*/5 * * * * *")
  async processPendingBlocks() {
    if (!this.redisClient) {
      return;
    }

    try {
      // 每次最多处理 10 个
      const blockNums: string[] = [];
      for (let i = 0; i < 10; i++) {
        const num = await this.redisClient.sPop(this.KEY_PENDING_QUERY);
        if (!num) break;
        blockNums.push(num);
      }

      if (blockNums.length === 0) return;

      for (const blockNumStr of blockNums) {
        const blockNum = parseInt(blockNumStr, 10);
        if (Number.isNaN(blockNum)) continue;

        try {
          const block = await this.tronApiClient.getBlockByNum(blockNum);
          await this.publishBlock(block);
          await this.setBlockSucceed(blockNum);
        } catch (error) {
          // 处理失败，重新加入集合
          await this.redisClient.sAdd(
            this.KEY_PENDING_QUERY,
            blockNum.toString()
          );
          this.logger.error(
            `处理补偿区块 ${blockNum} 失败: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `处理待同步区块失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
