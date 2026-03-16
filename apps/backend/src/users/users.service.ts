import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { User, Funds, UniqueId, FUNDS_TYPE, FUNDS_CATE } from "@database/index";
import { UserSearchDto } from "./dto/user-search.dto";
import { EditUserDto } from "./dto/edit-user.dto";

export interface UserListResult {
  list: User[];
  total: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private normalizeAndValidateWalletAddr(
    walletAddr: string | null | undefined
  ): string | null {
    if (walletAddr === undefined) return null;
    const trimmed = String(walletAddr).trim();
    if (!trimmed) return null;
    const tronAddressRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
    if (!tronAddressRegex.test(trimmed)) {
      throw new BadRequestException("钱包地址格式不正确");
    }
    return trimmed;
  }

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  /**
   * 分页 + 搜索用户列表（基于 UserSearchDto）
   */
  async listWithPagination(searchDto?: UserSearchDto): Promise<UserListResult> {
    const page = searchDto?.page ?? 1;
    const pageSize = searchDto?.pageSize ?? 10;
    const { id, name, startAt, endAt, status } = searchDto ?? {};
    const skip = (page - 1) * pageSize;

    const qb = this.repo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.email",
        "user.username",
        "user.nickname",
        "user.mobile",
        "user.walletAddr",
        "user.telegramId",
        "user.telegramUsername",
        "user.telegramNickname",
        "user.parentId",
        "user.type",
        "user.status",
        "user.balance",
        "user.createdAt",
        "user.updatedAt",
        "user.lastLoginAt",
        "user.lastLoginIp",
        "user.remark",
        "user.mailVerified",
        "user.walletVerified",
        "user.energyPriceFloat",
        "user.netPriceFloat",
        "user.planEnergyPriceFloat",
        "user.planNetPriceFloat",
        "user.fastEnergyPriceFloat",
        "user.fastNetPriceFloat",
      ])
      .skip(skip)
      .take(pageSize)
      .orderBy("user.id", "DESC");

    if (id != null) {
      qb.andWhere("user.id = :id", { id });
    }
    if (name && name.trim()) {
      const kw = `%${name.trim()}%`;
      qb.andWhere(
        "(user.username LIKE :kw OR user.nickname LIKE :kw OR user.email LIKE :kw)",
        { kw }
      );
    }
    if (startAt != null) {
      qb.andWhere("user.createdAt >= :startAt", { startAt });
    }
    if (endAt != null) {
      qb.andWhere("user.createdAt <= :endAt", { endAt });
    }
    if (status != null) {
      qb.andWhere("user.status = :status", { status });
    }

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  // async update(id: number, userData: Partial<User>): Promise<User | null> {
  //   await this.repo.update(id, userData);
  //   return this.repo.findOne({
  //     where: { id },
  //     select: [
  //       "id",
  //       "username",
  //       "nickname",
  //       "parentId",
  //       "balance",
  //       "createdAt",
  //       "updatedAt",
  //       "walletAddr",
  //       "telegramId",
  //       "status",
  //     ],
  //   });
  // }

  /**
   * 编辑用户信息（与 users 表可编辑字段一致）
   */
  async editUser(id: number, dto: EditUserDto): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    const now = Math.floor(Date.now() / 1000);

    const walletAddr =
      dto.walletAddr !== undefined
        ? this.normalizeAndValidateWalletAddr(dto.walletAddr)
        : user.walletAddr ?? null;

    const payload: Partial<User> = {
      updatedAt: now,
    };
    if (dto.username !== undefined) payload.username = dto.username ?? null;
    if (dto.nickname !== undefined) payload.nickname = dto.nickname ?? null;
    if (dto.email !== undefined) payload.email = dto.email ?? null;
    if (dto.mobile !== undefined) payload.mobile = dto.mobile ?? null;
    if (dto.walletAddr !== undefined) payload.walletAddr = walletAddr;
    if (dto.telegramId !== undefined)
      payload.telegramId = dto.telegramId ?? null;
    if (dto.telegramUsername !== undefined)
      payload.telegramUsername = dto.telegramUsername ?? null;
    if (dto.telegramNickname !== undefined)
      payload.telegramNickname = dto.telegramNickname ?? null;
    if (dto.remark !== undefined) payload.remark = dto.remark ?? null;
    if (dto.type !== undefined) payload.type = dto.type;
    if (dto.status !== undefined) payload.status = dto.status;
    // 价格浮动字段：接口传 number，写入 DB 时转为 string（decimal 列）
    if (dto.energyPriceFloat !== undefined)
      payload.energyPriceFloat = String(dto.energyPriceFloat);
    if (dto.netPriceFloat !== undefined)
      payload.netPriceFloat = String(dto.netPriceFloat);
    if (dto.planEnergyPriceFloat !== undefined)
      payload.planEnergyPriceFloat = String(dto.planEnergyPriceFloat);
    if (dto.planNetPriceFloat !== undefined)
      payload.planNetPriceFloat = String(dto.planNetPriceFloat);
    if (dto.fastEnergyPriceFloat !== undefined)
      payload.fastEnergyPriceFloat = String(dto.fastEnergyPriceFloat);
    if (dto.fastNetPriceFloat !== undefined)
      payload.fastNetPriceFloat = String(dto.fastNetPriceFloat);

    await this.repo.update(id, payload);

    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException(`用户 ID ${id} 不存在`);
    return { message: "用户信息修改成功" };
  }

  /**
   * 调整用户余额：更新 users.balance，并在 funds 表中插入调账记录（备注写在 funds.remark）
   * @param id 用户ID
   * @param change 变动金额（正数增加，负数减少）
   * @param remark 备注说明（写入 funds.remark）
   */
  async updateBalance(
    id: number,
    change: number,
    remark: string
  ): Promise<{ message: string }> {
    if (change === 0) {
      throw new BadRequestException("变动金额不能为 0");
    }

    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    const currentBalance =
      typeof user.balance === "string"
        ? parseFloat(user.balance)
        : Number(user.balance);
    const newBalance = Math.round((currentBalance + change) * 100) / 100;

    if (newBalance < 0) {
      throw new BadRequestException(
        `余额不足，当前余额: ${currentBalance.toFixed(2)}，无法减少 ${Math.abs(
          change
        ).toFixed(2)}`
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 更新用户余额
      await queryRunner.manager.update(
        User,
        { id },
        {
          balance: newBalance.toFixed(2),
          updatedAt: now,
        }
      );

      // 2. 在 funds 表插入调账记录（remark 存在 funds 中），同一事务内生成 id
      const uniqueIdRow = await queryRunner.manager.save(UniqueId, {
        createdAt: now,
      });
      const fundsId = uniqueIdRow.id;
      const fundsRow = queryRunner.manager.create(Funds, {
        id: fundsId,
        agentId: null,
        cate: FUNDS_CATE.BUYER,
        type: FUNDS_TYPE.ADJUST,
        uid: id,
        txId: null,
        currency: "TRX",
        exchange: "1.000",
        orderId: null,
        planId: null,
        amount: change.toFixed(2),
        realAmount: null,
        balance: newBalance.toFixed(2),
        remark: remark?.trim() || "后台调账",
        createdAt: now,
      });
      await queryRunner.manager.save(Funds, fundsRow);

      await queryRunner.commitTransaction();
      return { message: "余额调整成功" };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `余额调整失败: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      await queryRunner.release();
    }
  }
}
