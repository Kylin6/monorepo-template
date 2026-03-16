import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between, Like, In, Not } from "typeorm";
import { LeasePlan, LeaseRecords, User } from "@database/index";
import { PlanLog } from "@database/entities/entities/PlanLog";
import { LeasePlanSearchDto } from "./dto/lease-plan-search.dto";
import { SwitchPlan2Dto } from "./dto/switch-plan2.dto";
import { EditPlan2Dto } from "./dto/edit-plan2.dto";
import { ModifyPlan2PoolDto } from "./dto/modify-plan2-pool.dto";
import {
  LEASE_PLAN_CATE,
  LEASE_PLAN_STATUS,
} from "@database/constants/lease-plan";
import { BusinessException } from "../common/exceptions/business.exception";
import { QueueSenderService } from "../queue/queue-sender.service";
import {
  LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY,
  LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY,
  RECLAIM_QUEUE_KEY,
} from "@common/index";
import { LEASE_RECORDS_STATUS } from "@database/constants/lease-records";

type LeasePlanUser = Pick<
  User,
  "id" | "username" | "nickname" | "email" | "telegramNickname" | "telegramId"
>;

type LeasePlanWithUser = LeasePlan & { user?: LeasePlanUser | null };

@Injectable()
export class LeasePlanService {
  constructor(
    @InjectRepository(LeasePlan)
    private leasePlanRepository: Repository<LeasePlan>,
    @InjectRepository(LeaseRecords)
    private readonly leaseRecordRepository: Repository<LeaseRecords>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PlanLog)
    private readonly planLogRepository: Repository<PlanLog>,
    private readonly queueSender: QueueSenderService,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: LeasePlanSearchDto,
  ): Promise<{ list: LeasePlanWithUser[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: FindOptionsWhere<LeasePlan> = {};

    // 添加搜索条件
    if (searchDto?.planId !== undefined && searchDto?.planId !== null) {
      where.planId = searchDto.planId;
    }

    if (searchDto?.uid !== undefined && searchDto?.uid !== null) {
      where.uid = searchDto.uid;
    }

    if (searchDto?.cate !== undefined && searchDto?.cate !== null) {
      where.cate = searchDto.cate;
    }

    if (
      searchDto?.withBandwidth !== undefined &&
      searchDto?.withBandwidth !== null
    ) {
      where.withBandwidth = searchDto.withBandwidth;
    }

    if (
      searchDto?.toAddr !== undefined &&
      searchDto?.toAddr !== null &&
      searchDto.toAddr !== ""
    ) {
      where.toAddr = Like(`%${searchDto.toAddr}%`);
    }

    if (searchDto?.status !== undefined && searchDto?.status !== null) {
      where.status = searchDto.status;
    } else {
      where.status = Not(-10);
    }

    // 时间范围查询
    const startAt = searchDto?.startAt;
    const endAt = searchDto?.endAt;
    if (startAt != null || endAt != null) {
      where.createdAt = Between(startAt ?? 0, endAt ?? Number.MAX_SAFE_INTEGER);
    }

    const [list, total] = await this.leasePlanRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { planId: "DESC" },
    });

    if (!list.length) {
      return { list: [], total };
    }

    const userIds = Array.from(
      new Set(
        list
          .map((plan) => plan.uid)
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    let enrichedList: LeasePlanWithUser[] = list.map((plan) => ({
      ...plan,
    }));

    if (userIds.length) {
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
        select: [
          "id",
          "username",
          "nickname",
          "email",
          "telegramId",
          "telegramNickname",
        ],
      });
      const userMap = new Map(users.map((user) => [user.id, user]));
      enrichedList = enrichedList.map((plan) => ({
        ...plan,
        user: userMap.get(plan.uid ?? 0) ?? null,
      }));
    }

    return { list: enrichedList, total };
  }

  async findLog(
    page: number = 1,
    pageSize: number = 10,
    planId: number,
  ): Promise<{ list: PlanLog[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [list, total] = await this.planLogRepository.findAndCount({
      where: { planId },
      skip,
      take: pageSize,
      order: { id: "DESC" },
    });
    return { list, total };
  }

  async close(planId: number): Promise<void> {
    const plan = await this.leasePlanRepository.findOne({
      where: { planId, status: LEASE_PLAN_STATUS.ACTIVE },
    });
    if (!plan) {
      throw new BusinessException(400, "托管计划不存在或已关闭");
    }

    plan.status = LEASE_PLAN_STATUS.INACTIVE;
    await this.leasePlanRepository.save(plan);

    // 回收托管1订单
    if (plan.cate === LEASE_PLAN_CATE.PLAN1) {
      // 获取为当前计划的订单
      const orders = await this.leaseRecordRepository.find({
        where: { planId, status: LEASE_RECORDS_STATUS.DELEGATED },
      });

      if (orders.length) {
        // 逐条投递到回收队列，由 work 侧 undelegation 处理
        await Promise.all(
          orders.map((o) =>
            this.queueSender.send(RECLAIM_QUEUE_KEY, { orderId: o.orderId }),
          ),
        );
      }
    }

    // 托管2套餐需要回收池子
    if (plan.cate === LEASE_PLAN_CATE.PLAN2) {
      await this.queueSender.send(LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY, {
        planId,
        type: "E",
      });
      if (plan.withBandwidth) {
        await this.queueSender.send(LEASE_PLAN2_RECLAIM_POOL_QUEUE_KEY, {
          planId,
          type: "B",
        });
      }
      return;
    }
  }

  async switchToPlan2(planId: number, body: SwitchPlan2Dto): Promise<void> {
    const plan = await this.leasePlanRepository.findOne({
      where: {
        planId,
        status: LEASE_PLAN_STATUS.ACTIVE,
        cate: LEASE_PLAN_CATE.PLAN1,
      },
    });
    if (!plan) {
      throw new BusinessException(
        400,
        "托管计划不存在/未开启，或不是托管1套餐",
      );
    }

    // energy pool 必填（来自前端传参）
    if (!body.energyPoolAddr) {
      throw new BusinessException(400, "energyPoolAddr 必填");
    }
    if (!body.energyPoolAmount || Number(body.energyPoolAmount) <= 0) {
      throw new BusinessException(400, "energyPoolAmount 必填且必须 > 0");
    }

    // withBandwidth=10 时，net pool 必填
    if (plan.withBandwidth) {
      if (!body.netPoolAddr) {
        throw new BusinessException(400, "netPoolAddr 必填（包带宽时）");
      }
      if (!body.netPoolAmount || Number(body.netPoolAmount) <= 0) {
        throw new BusinessException(
          400,
          "netPoolAmount 必填且必须 > 0（包带宽时）",
        );
      }
    }

    // 写入池子与触发配置
    plan.energyPoolAddr = body.energyPoolAddr;
    plan.energyPoolAmount = body.energyPoolAmount;
    if (body.energyTrigger !== undefined) {
      plan.energyTrigger = body.energyTrigger;
    }
    if (body.energySupply !== undefined) {
      plan.energySupply = body.energySupply;
    }
    if (plan.withBandwidth) {
      plan.netPoolAddr = body.netPoolAddr!;
      plan.netPoolAmount = body.netPoolAmount!;
      if (body.netTrigger !== undefined) {
        plan.netTrigger = body.netTrigger;
      }
      if (body.netSupply !== undefined) {
        plan.netSupply = body.netSupply;
      }
    }

    plan.cate = LEASE_PLAN_CATE.PLAN2;
    await this.leasePlanRepository.save(plan);

    // 获取为当前计划的订单
    const orders = await this.leaseRecordRepository.find({
      where: { planId, status: LEASE_RECORDS_STATUS.DELEGATED },
    });

    if (orders.length) {
      // 逐条投递到回收队列，由 work 侧 undelegation 处理
      await Promise.all(
        orders.map((o) =>
          this.queueSender.send(RECLAIM_QUEUE_KEY, { orderId: o.orderId }),
        ),
      );
    }

    await this.queueSender.send(LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY, {
      planId: plan.planId,
      type: "E",
    });
    if (plan.withBandwidth) {
      await this.queueSender.send(LEASE_PLAN2_DELEGATE_POOL_QUEUE_KEY, {
        planId: plan.planId,
        type: "B",
      });
    }
  }

  async editPlan2(planId: number, body: EditPlan2Dto): Promise<void> {
    const plan = await this.leasePlanRepository.findOne({
      where: { planId, cate: LEASE_PLAN_CATE.PLAN2 },
    });
    if (!plan) {
      throw new BusinessException(400, "托管2套餐不存在");
    }

    const pickInt = (v: any): number | null => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    };

    const energyTrigger = pickInt(body?.energyTrigger);
    const energySupply = pickInt(body?.energySupply);
    const netTrigger = pickInt(body?.netTrigger);
    const netSupply = pickInt(body?.netSupply);

    if (energyTrigger !== null) plan.energyTrigger = energyTrigger;
    if (energySupply !== null) plan.energySupply = energySupply;
    if (netTrigger !== null) plan.netTrigger = netTrigger;
    if (netSupply !== null) plan.netSupply = netSupply;

    await this.leasePlanRepository.save(plan);
  }

  async modifyPlan2Pool(
    _planId: number,
    _body: ModifyPlan2PoolDto,
  ): Promise<Record<string, never>> {
    // TODO: 流程待定（先按需求返回空）
    return {};
  }
}
