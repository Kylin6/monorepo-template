import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  getRechargeApplyRepository,
  getUniqueIdRepository,
  createUniqueId,
  type RechargeApply,
} from "@database/index";
import {
  RECHARGE_APPLY_CATE,
  RECHARGE_APPLY_STATUS,
} from "@database/constants/recharge-apply";
import { BusinessException } from "../common/exceptions/business.exception";
import { SysCfgService } from "./syscfg.service";

/**
 * 充值相关服务
 *
 * - 普通余额充值申请
 * - 时长租赁充值申请（在 recharge_apply 上打 cate/extra 标记）
 * - 统一封装“随机金额尾数”逻辑，保证在有效期内金额唯一
 */
@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  /**
   * 随机尾数精度：0.0001
   * 尾数范围：0 ~ (RANDOM_MAX - 1) * RANDOM_SCALE
   */
  private readonly RANDOM_SCALE = 0.0001;
  private readonly RANDOM_MAX = 1000; // 0-999
  private readonly DEFAULT_EXPIRE_MINUTES = 10;

  constructor(
    private readonly configService: ConfigService,
    private readonly sysCfgService: SysCfgService
  ) {}

  private async repo() {
    return getRechargeApplyRepository();
  }

  /**
   * 生成在有效充值申请中唯一的金额（带随机尾数）
   */
  private async generateUniqueAmount(
    baseAmount: number,
    currency: string
  ): Promise<string> {
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
      throw new BusinessException(400, "无效的充值金额");
    }

    const repo = await this.repo();
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < this.RANDOM_MAX; i++) {
      const randomInt = Math.floor(Math.random() * this.RANDOM_MAX); // 0-999
      const addon = Number((randomInt * this.RANDOM_SCALE).toFixed(4));
      const candidate = Number((baseAmount + addon).toFixed(4));
      const candidateStr = candidate.toFixed(4);

      const existing = await repo.findOne({
        where: {
          amount: candidateStr,
          currency,
          status: RECHARGE_APPLY_STATUS.PENDING,
        } as any,
      });

      // 没有记录，或者记录已过期，都可以复用这个金额
      if (!existing || (existing.expireAt ?? 0) <= now) {
        return candidateStr;
      }
    }

    this.logger.error("生成唯一充值金额失败，已达到最大尝试次数");
    throw new BusinessException(400, "生成充值金额失败，请稍后重试");
  }

  /**
   * 获取收款地址：
   * 1) 优先使用 SysCfg.rechargeAddr
   */
  private async resolveRechargeAddress(): Promise<string> {
    const cfg = await this.sysCfgService.getSysCfgValues();
    const fromSysCfg = cfg.rechargeAddr?.trim();

    const addr = fromSysCfg?.trim() ?? "";

    if (!addr) {
      throw new BusinessException(
        400,
        "系统未配置有效的充值地址，请联系管理员"
      );
    }

    return addr;
  }

  /**
   * 创建基础充值申请（cate = RECHARGE）
   */
  async createRechargeApply(
    userId: number,
    amount: string,
    currency: string
  ): Promise<RechargeApply> {
    const baseAmount = Number(amount);
    const finalAmount = await this.generateUniqueAmount(baseAmount, currency);
    const toAddr = await this.resolveRechargeAddress();

    const now = Math.floor(Date.now() / 1000);
    const expireAt = now + this.DEFAULT_EXPIRE_MINUTES * 60;
    const uniqueIdRepo = await getUniqueIdRepository();
    const newId = await createUniqueId(uniqueIdRepo);

    const repo = await this.repo();
    const entity = repo.create({
      id: newId,
      cate: RECHARGE_APPLY_CATE.RECHARGE,
      uid: userId,
      agentId: null,
      amount: finalAmount,
      currency,
      toAddr,
      count: null,
      createdAt: now,
      expireAt,
      extra: null,
      status: RECHARGE_APPLY_STATUS.PENDING,
    });

    return await repo.save(entity);
  }

  /**
   * 创建时长租赁充值申请
   *
   * - cate = DURATION_LEASE
   * - extra 字段存放时长租赁的业务信息
   */
  async createDurationLeaseApply(
    userId: number,
    amount: string,
    currency: string,
    count: number,
    expire: number,
    expireType: "D" | "H" | "M",
    targetAddr: string,
    resourceType: "E" | "N",
    extra: Record<string, unknown>
  ): Promise<
    RechargeApply & {
      count: number;
      expire: number;
      expireType: "D" | "H" | "M";
      resourceType: "E" | "N";
      extra: Record<string, unknown>;
    }
  > {
    const repo = await this.repo();

    // 1) 生成唯一金额 + 收款地址
    const baseAmount = Number(amount);
    const finalAmount = await this.generateUniqueAmount(baseAmount, currency);
    const toAddr = await this.resolveRechargeAddress();

    // 2) 计算过期时间并生成自增 ID
    const now = Math.floor(Date.now() / 1000);
    const expireAt = now + this.DEFAULT_EXPIRE_MINUTES * 60;

    const uniqueIdRepo = await getUniqueIdRepository();
    const newId = await createUniqueId(uniqueIdRepo);

    // 3) 写入 recharge_apply 表（cate = DURATION_LEASE）
    const entity = repo.create({
      id: newId,
      cate: RECHARGE_APPLY_CATE.DURATION_LEASE,
      uid: userId,
      agentId: null,
      amount: finalAmount,
      currency,
      toAddr,
      count,
      createdAt: now,
      expireAt,
      extra: JSON.stringify({
        ...extra,
        expire,
        expireType,
        resourceType,
        targetAddr,
      }),
      status: RECHARGE_APPLY_STATUS.PENDING,
    });

    const saved = await repo.save(entity);
    const { extra: _rawExtra, ...rest } = saved as RechargeApply & {
      extra: string | null;
    };

    return {
      ...(rest as RechargeApply),
      count,
      expire,
      expireType,
      resourceType,
      ...extra,
    } as any;
  }
}
