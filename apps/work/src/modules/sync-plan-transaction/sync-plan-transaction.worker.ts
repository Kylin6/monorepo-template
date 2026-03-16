import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { sendQueueJob } from "@queue/index";
import { SYNC_PLAN_ADDR_TRANSACTION_QUEUE_KEY } from "@common/index";
import { getDataSource, LeasePlan, PlanTransaction } from "@database/index";
import { LEASE_PLAN_CATE } from "@database/constants/lease-plan";
import { createPlan2Lease } from "@database/helper/lease-plan.helper";

/**
 * 对标 PHP SyncPlanTransaction.php:
 * - Timer::add(15, ...) 扫描 plan_transaction.status=0 的记录，投递到队列
 */
@Injectable()
export class SyncPlanTransactionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncPlanTransactionWorker.name);
  private timers: NodeJS.Timeout[] = [];
  private running = false;
  private runningPlan2 = false;

  async onModuleInit() {
    // 15 秒：同步 plan_transaction 手续费信息（入队）
    this.timers.push(
      setInterval(() => {
        this.tick().catch((e) => this.logger.error("tick error", e as any));
      }, 15_000)
    );

    // 3 秒：PLAN2 托管计划触发创建托管 2.0 订单
    this.timers.push(
      setInterval(() => {
        this.tickPlan2().catch((e) =>
          this.logger.error("tickPlan2 error", e as any)
        );
      }, 3_000)
    );

    this.logger.log("SyncPlanTransactionWorker timers started");
  }

  async onModuleDestroy() {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const ds = await getDataSource();
      const repo = ds.getRepository(PlanTransaction);
      const ts = await repo.find({
        where: { status: 0 },
        take: 5,
        order: { id: "ASC" },
      });
      for (const t of ts) {
        await sendQueueJob(SYNC_PLAN_ADDR_TRANSACTION_QUEUE_KEY, { id: t.id });
      }
    } finally {
      this.running = false;
    }
  }

  /**
   * 3 秒一次：
   * - 先获取 lease_plan(cate=PLAN2,status=10) 的 toAddr
   * - 查 PlanTransaction(addr=toAddr,status=10) 的最新一条
   * - 如果 planTx.createdAt > lease_plan.updatedAt，则创建托管2.0订单
   */
  private async tickPlan2() {
    if (this.runningPlan2) return;
    this.runningPlan2 = true;
    try {
      const ds = await getDataSource();
      const planRepo = ds.getRepository(LeasePlan);
      const planTxRepo = ds.getRepository(PlanTransaction);

      const plans = await planRepo.find({
        where: { cate: LEASE_PLAN_CATE.PLAN2, status: 10 } as any,
      });
      // console.log("plans", plans);
      if (!plans.length) return;

      const now = Math.floor(Date.now() / 1000);

      for (const plan of plans) {
        const toAddr = plan.toAddr?.trim();
        if (!toAddr) continue;

        // 找该地址最新的已同步 plan_transaction（status=10）
        const latestTx = await planTxRepo.findOne({
          where: { addr: toAddr, status: 10, orderId: null } as any,
          order: { transferAt: "DESC", id: "DESC" } as any,
        });
        if (!latestTx) continue;

        const txTransferAt = Number(latestTx.transferAt ?? 0) || 0;
        const planEnergyDelegateAt = Number(plan.energyDelegateAt ?? 0) || 0;

        if (txTransferAt <= planEnergyDelegateAt) continue;

        const amount = Number(latestTx.energyUsage ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        try {
          const order = await createPlan2Lease(ds, plan, amount);
          if (order) {
            latestTx.orderId = order.orderId;
            latestTx.updatedAt = now;
            latestTx.status = 15;
            await planTxRepo.save(latestTx);
          }
        } catch (e) {
          this.logger.warn(
            `tickPlan2 createPlan2Lease failed planId=${plan.planId} toAddr=${toAddr}: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    } finally {
      this.runningPlan2 = false;
    }
  }
}

