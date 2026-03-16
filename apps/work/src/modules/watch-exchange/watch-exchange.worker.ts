import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { In } from "typeorm";
import {
  Exchange,
  TransactionRecords,
  UniqueId,
  createUniqueId,
  getDataSource,
  getTransactionRecordsRepository,
  getSysCfgRepository,
  U2T_EXCHANGE_STATUS,
  TRANSACTION_RECORDS_STATUS,
  TRANSACTION_RECORDS_TYPE,
} from "@database/index";
import { TronHelper } from "@database/helper/tron.helper";
import { getSetting } from "@database/helper/sys-cfg.helper";
import { sendQueueJob } from "@queue/index";
import { U2T_EXCHANGE_QUEUE_KEY } from "@common/index";

/**
 * 对标 PHP WatchExchange::run 中的两个 Timer::add(3, ...)：
 * - 扫描 QuickUReceiverAddr 收到的 USDT 转账，创建 Exchange 并投递到 U2T_EXCHANGE_QUEUE_KEY
 * - 扫描 QuickU2TAddr 发出的 TRX 转账，确认 Exchange 状态
 */
@Injectable()
export class WatchExchangeWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WatchExchangeWorker.name);

  private timers: NodeJS.Timeout[] = [];
  private runningIn = false;
  private runningOut = false;

  async onModuleInit() {
    this.timers.push(
      setInterval(() => {
        this.tickIn().catch((e) => this.logger.error("tickIn error", e as any));
      }, 3_000)
    );
    this.timers.push(
      setInterval(() => {
        this.tickOut().catch((e) =>
          this.logger.error("tickOut error", e as any)
        );
      }, 3_000)
    );
    this.logger.log("WatchExchangeWorker timers started");
  }

  async onModuleDestroy() {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
  }

  /** 扫描 USDT 入账 -> 创建 exchange -> 入队 */
  private async tickIn() {
    if (this.runningIn) return;
    this.runningIn = true;
    try {
      const txRepo = await getTransactionRecordsRepository();
      const sysRepo = await getSysCfgRepository();
      const u2tRechargeAddrRow = await sysRepo.findOne({
        where: { key: "u2tRechargeAddr" },
        select: ["value"],
      });
      const u2tRechargeAddr = u2tRechargeAddrRow?.value?.trim();
      if (!u2tRechargeAddr) return;

      const minU2T = Number(
        await getSetting(sysRepo, "minU2TAmount").catch(() => "0")
      );

      const transactions = await txRepo.find({
        where: {
          currency: TronHelper.CURRENCY_USDT,
          toAddr: u2tRechargeAddr,
          status: TRANSACTION_RECORDS_STATUS.PENDING,
        },
      });
      if (!transactions.length) return;

      for (const tx of transactions) {
        try {
          tx.status = TRANSACTION_RECORDS_STATUS.DONE;
          await txRepo.save(tx);

          const amount = Number(tx.amount ?? 0);
          if (Number.isFinite(minU2T) && amount < minU2T) continue;

          const exchange = await this.createExchange(tx);
          if (exchange) {
            await sendQueueJob(U2T_EXCHANGE_QUEUE_KEY, {
              exchangeId: exchange.id,
            });
          }
        } catch (e) {
          this.logger.warn(
            `tickIn txId=${tx.txId} error: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    } finally {
      this.runningIn = false;
    }
  }

  /** 扫描 TRX 出账 -> 确认 exchange 成功 */
  private async tickOut() {
    if (this.runningOut) return;
    this.runningOut = true;
    try {
      const txRepo = await getTransactionRecordsRepository();
      const sysCfgRepo = await getSysCfgRepository();
      const u2tOutAddrRow = await sysCfgRepo.findOne({
        where: { key: "u2tOutTAddr" },
        select: ["value"],
      });
      const u2tOutTAddr = u2tOutAddrRow?.value?.trim();
      if (!u2tOutTAddr) return;

      const transactions = await txRepo.find({
        where: {
          fromAddr: u2tOutTAddr,
          status: TRANSACTION_RECORDS_STATUS.PENDING,
        },
      });
      if (!transactions.length) return;

      const ds = await getDataSource();
      const exchangeRepo = ds.getRepository(Exchange);

      for (const tx of transactions) {
        try {
          tx.status = TRANSACTION_RECORDS_STATUS.DONE;
          await txRepo.save(tx);

          const exchange = await exchangeRepo.findOne({
            where: {
              status: U2T_EXCHANGE_STATUS.PROCESSING,
              transferOutTxId: tx.txId ?? "",
            } as any,
          });
          if (exchange) {
            await this.confirmExchange(exchange, tx);
          }
        } catch (e) {
          this.logger.warn(
            `tickOut txId=${tx.txId} error: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    } finally {
      this.runningOut = false;
    }
  }

  /** 对标 PHP createExchange(TransactionRecords) */
  private async createExchange(
    tx: TransactionRecords
  ): Promise<Exchange | null> {
    const ds = await getDataSource();
    const sysRepo = await getSysCfgRepository();

    return ds.transaction(async (manager) => {
      const uniqueIdRepo = manager.getRepository(UniqueId);
      const exchangeRepo = manager.getRepository(Exchange);
      const txRepo = manager.getRepository(TransactionRecords);

      const id = await createUniqueId(uniqueIdRepo);

      const amount = Number(tx.amount ?? 0);
      const baseRateStr = await getSetting(sysRepo, "uRechargeExchange").catch(
        () => "0"
      );
      const baseRate = Number(baseRateStr);
      const rate = Number.isFinite(baseRate) ? baseRate : 0;
      const exchangeAmount = Math.round(rate * amount * 100) / 100;

      const now = Math.floor(Date.now() / 1000);
      const exchange = exchangeRepo.create({
        id,
        agentId: null,
        transferInTxId: tx.txId ?? null,
        from: tx.fromAddr ?? "",
        to: tx.toAddr ?? "",
        amount: String(amount),
        currency: TronHelper.CURRENCY_USDT,
        baseRate: String(rate),
        rate: String(rate),
        exchange: String(exchangeAmount),
        status: U2T_EXCHANGE_STATUS.PENDING,
        createdAt: now,
      }) as unknown as Exchange;

      tx.type = TRANSACTION_RECORDS_TYPE.U2T_IN;
      tx.status = TRANSACTION_RECORDS_STATUS.FINISHED;
      await txRepo.save(tx);
      await exchangeRepo.save(exchange);
      return exchange;
    });
  }

  /** 对标 PHP confirmExchange */
  private async confirmExchange(exchange: Exchange, tx: TransactionRecords) {
    const ds = await getDataSource();
    await ds.transaction(async (manager) => {
      const exchangeRepo = manager.getRepository(Exchange);
      const txRepo = manager.getRepository(TransactionRecords);

      exchange.owner = tx.fromAddr ?? null;
      exchange.status = U2T_EXCHANGE_STATUS.SUCCEED;
      await exchangeRepo.save(exchange);

      tx.type = TRANSACTION_RECORDS_TYPE.U2T_OUT;
      tx.status = TRANSACTION_RECORDS_STATUS.FINISHED;
      await txRepo.save(tx);
    });
  }
}
