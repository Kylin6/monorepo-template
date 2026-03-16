import { Injectable, Logger } from "@nestjs/common";
import { BusinessException } from "../common/exceptions/business.exception";
import {
  getDataSource,
  getResourcePriceRepository,
  getRechargeApplyRepository,
  getUniqueIdRepository,
  getSysCfgRepository,
  createUniqueId,
  ResourcePrice,
  RechargeApply,
  User,
  LeaseRecords,
  LeasePlan,
  Funds,
} from "@database/index";
import { ResourcePriceModel, FundsModel } from "@database/index";
import {
  RECHARGE_APPLY_STATUS,
  RECHARGE_APPLY_CATE,
} from "@database/constants/recharge-apply";
import {
  LEASE_RECORDS_STATUS,
  LEASE_RECORDS_SOURCE,
  DELEGATE_QUEUE_KEY,
} from "@database/constants/lease-records";
import { LEASE_PLAN_CATE, LEASE_PLAN_STATUS } from "@database/constants/lease-plan";
import { In } from "typeorm";
import { sendQueueJob } from "@queue/index";
import { SysCfgService } from "./syscfg.service";

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly sysCfgService = new SysCfgService();
  private readonly DEFAULT_PAGE_SIZE = 10;
  // 获取快捷指令能量单价（基础价 + 用户浮动价，单位：sun）
  async getEnergyUnitPriceForShortcut(
    userId: number,
    expire: number,
    expireType: "D" | "H" | "M",
  ): Promise<{ finalPrice: number } | null> {
    const priceRepo = await getResourcePriceRepository();
    const priceRow = await priceRepo.findOne({
      where: {
        type: "E",
        status: 10,
        agentId: null,
        expire,
        expireType,
      } as any,
    });

    if (!priceRow) {
      return null;
    }

    const ds = await getDataSource();
    const user = await ds.getRepository(User).findOne({
      where: { id: userId },
    });

    // 没有用户时，仅返回基础价格
    if (!user) {
      const base = Number(priceRow.price) || 0;
      return { finalPrice: base };
    }

    const finalPrice = ResourcePriceModel.getFinalPriceForUser(priceRow, user);
    return { finalPrice };
  }

  /**
   * 获取时长租赁价格列表（全局，按时长排序）
   */
  async getDurationLeasePriceList(): Promise<ResourcePrice[]> {
    const repo = await getResourcePriceRepository();
    const list = await repo.find({
      where: {
        type: "E",
        status: 10,
      } as any,
      order: {
        expireType: "ASC",
        expire: "ASC",
      } as any,
    });
    return list;
  }

  /**
   * 创建时长租赁订单（无代理）
   * 扣用户余额、写 lease_records、写 funds、投递委托队列
   */
  async createDurationLeaseOrder(
    userId: number,
    toAddr: string,
    amount: number,
    expire: number,
    expireType: "D" | "H" | "M",
    resourceType: "E" | "N",
    source?: number,
  ): Promise<{ orderId: number; orders: Array<{ id: number }> }> {
    this.logger.log(
      `创建时长租赁订单 => userId: ${userId}, amount: ${amount}, expire: ${expire}, expireType: ${expireType}, type: ${resourceType}, toAddr: ${toAddr}`,
    );

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const fail = async (code: number, message: string) => {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw new BusinessException(code, message);
    };

    try {
      const now = Math.floor(Date.now() / 1000);
      const type = resourceType === "N" ? "B" : "E";

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        return fail(404, "用户不存在");
      }

      const priceRow = await queryRunner.manager.findOne(ResourcePrice, {
        where: {
          status: 10,
          type,
          expire,
          expireType,
          agentId: null as any,
        },
      });
      if (!priceRow) {
        return fail(404, "价格配置不存在");
      }

      const finalPricePerUnit = ResourcePriceModel.getFinalPriceForUser(
        priceRow,
        user,
      );
      const totalCost =
        Math.round(((amount * finalPricePerUnit) / 1_000_000) * 100) / 100;

      if (totalCost <= 0) {
        return fail(400, "订单金额异常");
      }

      const balance = parseFloat(user.balance);
      if (!Number.isFinite(balance) || balance < totalCost) {
        return fail(410, "余额不足，请先充值");
      }

      const uniqueIdRepo = await getUniqueIdRepository();
      const orderId = await createUniqueId(uniqueIdRepo);
      const newBalance = Math.round((balance - totalCost) * 100) / 100;

      const leaseRecord = queryRunner.manager.create(LeaseRecords, {
        orderId,
        uid: userId,
        type,
        amount: String(amount),
        expire,
        expireType,
        toAddr,
        agentId: null,
        expiredAt: null,
        fromAddr: null,
        price: finalPricePerUnit.toFixed(2),
        cost: totalCost.toFixed(2),
        agentPrice: null,
        agentCost: null,
        commission: "0.00",
        agentCommission: null,
        netCost: null,
        agentNetCost: null,
        totalCost: totalCost.toFixed(2),
        agentTotalCost: null,
        balance: newBalance.toFixed(2),
        status: LEASE_RECORDS_STATUS.PAYED,
        source: source ?? LEASE_RECORDS_SOURCE.TELEGRAM,
        createdAt: now,
        progress: 0,
      } as any);
      await queryRunner.manager.save(leaseRecord);

      await queryRunner.manager.decrement(
        User,
        { id: userId },
        "balance",
        totalCost,
      );

      const fundsData = await FundsModel.createLeaseFundsData(
        leaseRecord,
        newBalance.toFixed(2),
        uniqueIdRepo,
      );
      const fundsRecord = queryRunner.manager.create(Funds, fundsData);
      await queryRunner.manager.save(fundsRecord);

      await queryRunner.commitTransaction();
      queryRunner.release();

      await sendQueueJob(DELEGATE_QUEUE_KEY, { orderId });

      this.logger.log(
        `时长租赁订单创建成功 => orderId: ${orderId}, totalCost: ${totalCost}`,
      );

      return { orderId, orders: [{ id: orderId }] };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (error instanceof BusinessException) throw error;
      this.logger.error("创建时长租赁订单失败:", error);
      const errMsg =
        error instanceof Error
          ? error.message || "创建时长租赁订单失败"
          : "创建时长租赁订单失败";
      throw new BusinessException(500, errMsg);
    }
  }
  /**
   * 余额支付：根据 传参创建订单
   */
  async createDurationLeaseOrderByBalance(
    userId: number,
    expire: number,
    expireType: "D" | "H" | "M",
    count: number,
    totalEnergy: number,
    targetAddr: string,
  ): Promise<{
    expire: number;
    expireType: "D" | "H" | "M";
    count: number;
    energyPerCount: number;
    toAddr: string;
    orderId: number | string;
  }> {
    // const repo = await getRechargeApplyRepository();
    // const apply = await repo.findOne({ where: { id: applyId } });

    // if (!apply) {
    //   throw new BusinessException(400, "未找到对应的充值申请");
    // }

    // if (apply.status !== RECHARGE_APPLY_STATUS.PENDING) {
    //   throw new BusinessException(400, "订单状态异常，无法余额支付");
    // }

    // if (apply.cate !== RECHARGE_APPLY_CATE.DURATION_LEASE) {
    //   throw new BusinessException(400, "非时长租赁申请，无法余额支付");
    // }

    // let extra: Record<string, unknown> = {};
    // try {
    //   extra = (apply.extra && JSON.parse(apply.extra)) || {};
    // } catch {
    //   throw new BusinessException(400, "订单扩展信息无效");
    // }

    // const expire = Number(extra.expire ?? 0);
    // const rawExpireType = String(extra.expireType ?? "M").toUpperCase();
    // const expireType = (
    //   ["D", "H", "M"].includes(rawExpireType) ? rawExpireType : "M"
    // ) as "D" | "H" | "M";
    const toAddr = targetAddr;
    // let energyPerCount = energyPerCount;
    // const totalEnergy = count * energyPerCount;

    // if (!Number.isFinite(count) || count <= 0) count = 1;
    // if (!Number.isFinite(totalEnergy) || totalEnergy <= 0) {
    //   if (Number.isFinite(energyPerCount) && energyPerCount > 0) {
    //     totalEnergy = count * energyPerCount;
    //   } else {
    //     throw new BusinessException(400, "订单能量参数无效");
    //   }
    // }
    // if (!Number.isFinite(energyPerCount) || energyPerCount <= 0) {
    //   energyPerCount = Math.round(totalEnergy / count) || totalEnergy;
    // }

    const orderResult = await this.createDurationLeaseOrder(
      userId,
      toAddr,
      totalEnergy,
      expire,
      expireType,
      "E",
    );

    return {
      orderId: orderResult.orderId,
      expire,
      expireType,
      count,
      energyPerCount: totalEnergy,
      toAddr,
    };
  }

  // /**
  //  * 余额支付：根据 recharge_apply（时长租赁）创建订单并更新申请状态
  //  */
  // async createDurationLeaseOrderByBalance(applyId: number): Promise<{
  //   expire: number;
  //   expireType: "D" | "H" | "M";
  //   count: number;
  //   energyPerCount: number;
  //   toAddr: string;
  //   orderId: number | string;
  // }> {
  //   const repo = await getRechargeApplyRepository();
  //   const apply = await repo.findOne({ where: { id: applyId } });

  //   if (!apply) {
  //     throw new BusinessException(400, "未找到对应的充值申请");
  //   }

  //   if (apply.status !== RECHARGE_APPLY_STATUS.PENDING) {
  //     throw new BusinessException(400, "订单状态异常，无法余额支付");
  //   }

  //   if (apply.cate !== RECHARGE_APPLY_CATE.DURATION_LEASE) {
  //     throw new BusinessException(400, "非时长租赁申请，无法余额支付");
  //   }

  //   let extra: Record<string, unknown> = {};
  //   try {
  //     extra = (apply.extra && JSON.parse(apply.extra)) || {};
  //   } catch {
  //     throw new BusinessException(400, "订单扩展信息无效");
  //   }

  //   const expire = Number(extra.expire ?? 0);
  //   const rawExpireType = String(extra.expireType ?? "M").toUpperCase();
  //   const expireType = (
  //     ["D", "H", "M"].includes(rawExpireType) ? rawExpireType : "M"
  //   ) as "D" | "H" | "M";
  //   const toAddr = (extra.targetAddr as string) || "";
  //   let count = Number(extra.count ?? apply.count ?? 0);
  //   let energyPerCount = Number(extra.energyPerCount ?? 0);
  //   let totalEnergy = Number(extra.totalEnergy ?? 0);

  //   if (!Number.isFinite(expire) || expire <= 0) {
  //     throw new BusinessException(400, "订单时长参数无效");
  //   }

  //   if (!toAddr) {
  //     throw new BusinessException(400, "缺少接收地址");
  //   }

  //   if (!Number.isFinite(count) || count <= 0) count = 1;
  //   if (!Number.isFinite(totalEnergy) || totalEnergy <= 0) {
  //     if (Number.isFinite(energyPerCount) && energyPerCount > 0) {
  //       totalEnergy = count * energyPerCount;
  //     } else {
  //       throw new BusinessException(400, "订单能量参数无效");
  //     }
  //   }
  //   if (!Number.isFinite(energyPerCount) || energyPerCount <= 0) {
  //     energyPerCount = Math.round(totalEnergy / count) || totalEnergy;
  //   }

  //   const orderResult = await this.createDurationLeaseOrder(
  //     apply.uid,
  //     toAddr,
  //     totalEnergy,
  //     expire,
  //     expireType,
  //     "E"
  //   );

  //   await repo.update(
  //     { id: applyId },
  //     {
  //       status: RECHARGE_APPLY_STATUS.FINISHED,
  //       expireAt: Math.floor(Date.now() / 1000),
  //     }
  //   );

  //   return {
  //     orderId: orderResult.orderId,
  //     expire,
  //     expireType,
  //     count,
  //     energyPerCount,
  //     toAddr,
  //   };
  // }

  /**
   * 创建快捷指令订单
   */
  async createShortcutsOrder(
    userId: number,
    toAddr: string,
  ): Promise<{ orderId: number; orders: Array<{ id: number }> }> {
    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const fail = async (code: number, message: string) => {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw new BusinessException(code, message);
    };

    try {
      const now = Math.floor(Date.now() / 1000);
      const type = "E";

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        return fail(404, "用户不存在");
      }

      const sysCfgValues = await this.sysCfgService.getSysCfgValues();
      const shortcutsPrice = Number(sysCfgValues.shortcutsPrice ?? 6);
      const countAmount = Number(sysCfgValues.countAmount ?? 131000); // 每笔指令能量数量
      const totalCost = shortcutsPrice;

      if (totalCost <= 0) {
        return fail(400, "订单金额异常");
      }

      const balance = parseFloat(user.balance);
      if (!Number.isFinite(balance) || balance < totalCost) {
        return fail(410, "余额不足，请先充值");
      }

      const uniqueIdRepo = await getUniqueIdRepository();
      const orderId = await createUniqueId(uniqueIdRepo);
      const newBalance = Math.round((balance - totalCost) * 100) / 100;

      const leaseRecord = queryRunner.manager.create(LeaseRecords, {
        orderId,
        uid: userId,
        type,
        amount: String(countAmount),
        expire: 1,
        expireType: "H",
        toAddr,
        agentId: null,
        expiredAt: null,
        fromAddr: null,
        price: "0.00",
        cost: totalCost.toFixed(2),
        agentPrice: null,
        agentCost: null,
        commission: "0.00",
        agentCommission: null,
        netCost: null,
        agentNetCost: null,
        totalCost: totalCost.toFixed(2),
        agentTotalCost: null,
        balance: newBalance.toFixed(2),
        status: LEASE_RECORDS_STATUS.PAYED,
        source: LEASE_RECORDS_SOURCE.SHORTCUTS,
        createdAt: now,
        progress: 0,
      } as any);
      await queryRunner.manager.save(leaseRecord);

      await queryRunner.manager.decrement(
        User,
        { id: userId },
        "balance",
        totalCost,
      );

      const fundsData = await FundsModel.createShortcutsFundsData(
        leaseRecord,
        newBalance.toFixed(2),
        uniqueIdRepo,
      );
      const fundsRecord = queryRunner.manager.create(Funds, fundsData);
      await queryRunner.manager.save(fundsRecord);

      await sendQueueJob(DELEGATE_QUEUE_KEY, { orderId });

      await queryRunner.commitTransaction();
      queryRunner.release();

      return { orderId, orders: [{ id: orderId }] };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (error instanceof BusinessException) throw error;
      this.logger.error("创建快捷指令订单失败:", error);
      const errMsg =
        error instanceof Error
          ? error.message || "创建快捷指令订单失败"
          : "创建快捷指令订单失败";
      throw new BusinessException(500, errMsg);
    }
  }

  /**
   * 查询用户计划订单（分页，按 orderId DESC）
   */
  async findUserPlanOrders(
    userId: number,
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE,
  ): Promise<{
    list: LeasePlan[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const safePage = Math.max(1, Number(page || 1));
    const safePageSize = Math.max(
      1,
      Math.min(100, Number(pageSize || this.DEFAULT_PAGE_SIZE)),
    );
    const skip = (safePage - 1) * safePageSize;

    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);
    const [list, total] = await planRepo.findAndCount({
      where: { uid: userId, cate: In([LEASE_PLAN_CATE.PLAN1, LEASE_PLAN_CATE.PLAN2]) } as any,
      order: { planId: "DESC" } as any,
      skip,
      take: safePageSize,
    });

    return { list, total, page: safePage, pageSize: safePageSize };
  }

  // 创建智能托管订单
  async createSmartLeaseOrder(
    userId: number,
    toAddr: string,
    withBandwidth: number,
    limit: number
  ): Promise<{ planId: number }> {
    this.logger.log(
      `创建智能托管订单 => userId=${userId}, toAddr=${toAddr}, withBandwidth=${withBandwidth}, limit=${limit}`
    );

    const ds = await getDataSource();
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const fail = async (code: number, message: string) => {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw new BusinessException(code, message);
    };

    try {
      const now = Math.floor(Date.now() / 1000);

      if (!toAddr) {
        return fail(400, "缺少接收地址");
      }
      if (!Number.isFinite(limit) || limit <= 0) {
        return fail(400, "能量数量无效");
      }

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        return fail(404, "用户不存在");
      }
      if (parseFloat(user.balance) <= 0) {
        return fail(410, "余额不足，请先充值");
      }

      // 同一用户同一地址避免重复创建（运行中算存在）
      const existed = await queryRunner.manager.findOne(LeasePlan, {
        where: {
          uid: userId,
          cate: In([LEASE_PLAN_CATE.PLAN1, LEASE_PLAN_CATE.PLAN2]),
          toAddr,
          status: 10,
        } as any,
      });
      if (existed) {
        return fail(400, "该地址已存在托管计划，请勿重复创建");
      }

      const uniqueIdRepo = await getUniqueIdRepository();
      const planId = await createUniqueId(uniqueIdRepo);

      const plan = queryRunner.manager.create(LeasePlan, {
        planId,
        uid: userId,
        agentId: null,
        cate: LEASE_PLAN_CATE.PLAN1,
        withBandwidth,
        toAddr,
        type: "E",
        limit,
        count: 0,
        left: 0,
        createdAt: now,
        status: 10,
      });
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.logger.log(`智能托管订单创建成功 => planId=${planId}`);
      return { planId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (error instanceof BusinessException) throw error;
      this.logger.error("创建智能托管订单失败:", error);
      const errMsg =
        error instanceof Error
          ? error.message || "创建智能托管订单失败"
          : "创建智能托管订单失败";
      throw new BusinessException(500, errMsg);
    }
  }

  /**
   * 停止智能托管计划：
   * - 仅允许当前用户自己的 PLAN1/PLAN2 计划
   * - 将状态置为 INACTIVE
   */
  async stopPlanOrder(
    planId: number,
    userId: number
  ): Promise<LeasePlan | null> {
    const ds = await getDataSource();
    const planRepo = ds.getRepository(LeasePlan);

    const plan = await planRepo.findOne({
      where: {
        planId,
        uid: userId,
        cate: In([LEASE_PLAN_CATE.PLAN1, LEASE_PLAN_CATE.PLAN2]),
      } as any,
    });

    if (!plan) {
      throw new BusinessException(404, "未找到对应的托管计划");
    }

    if (plan.status === LEASE_PLAN_STATUS.INACTIVE) {
      return plan;
    }

    // 仅在机器人侧做「关闭计划」标记，具体回收逻辑由 work 进程负责
    plan.status = LEASE_PLAN_STATUS.INACTIVE;
    plan.updatedAt = Math.floor(Date.now() / 1000);
    await planRepo.save(plan);

    this.logger.log(
      `智能托管计划已停止 => planId=${planId}, uid=${userId}, toAddr=${plan.toAddr}`
    );

    return plan;
  }
}
