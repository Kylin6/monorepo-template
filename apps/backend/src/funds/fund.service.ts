import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between, In } from "typeorm";
import { Funds, User } from "@database/index";
import { FundSearchDto } from "./dto/fund-search.dto";

type FundUserInfo = Pick<
  User,
  "id" | "username" | "nickname" | "email" | "telegramId" | "telegramNickname"
>;

export type FundWithUser = Funds & { user?: FundUserInfo | null };

@Injectable()
export class FundsService {
  constructor(
    @InjectRepository(Funds)
    private readonly fundsRepository: Repository<Funds>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: FundSearchDto
  ): Promise<{ list: FundWithUser[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const where: FindOptionsWhere<Funds> = {};

    if (searchDto?.uid != null) where.uid = searchDto.uid;
    if (searchDto?.orderId != null) where.orderId = searchDto.orderId;
    if (searchDto?.type != null) where.type = searchDto.type;
    if (searchDto?.cate != null) where.cate = searchDto.cate;
    if (searchDto?.currency != null) where.currency = searchDto.currency;

    // 时间范围查询
    const startAt = searchDto?.startAt;
    const endAt = searchDto?.endAt;
    if (startAt != null || endAt != null) {
      where.createdAt = Between(startAt ?? 0, endAt ?? Number.MAX_SAFE_INTEGER);
    }

    const [list, total] = await this.fundsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { id: "DESC" },
    });

    if (list.length === 0) {
      return { list: [], total };
    }

    const uids = [...new Set(list.map((item) => item.uid).filter(Boolean))];
    const users = await this.userRepository.find({
      where: { id: In(uids) },
      select: [
        "id",
        "username",
        "nickname",
        "email",
        "telegramId",
        "telegramNickname",
      ],
    });
    const userMap = new Map<number, FundUserInfo>(
      users.map((u) => [u.id, u] as const)
    );

    const enrichedList: FundWithUser[] = list.map((item) => ({
      ...item,
      user: userMap.get(item.uid) ?? null,
    }));

    return { list: enrichedList, total };
  }
}
