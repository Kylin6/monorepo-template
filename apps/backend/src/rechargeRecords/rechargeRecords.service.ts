import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between, Like, In } from "typeorm";
import { RechargeRecords, User } from "@database/index";
import { RechargeRecordSearchDto } from "./dto/recharge-record-search.dto";

type RechargeRecordUser = Pick<
  User,
  "id" | "username" | "nickname" | "email" | "telegramNickname" | "telegramId"
>;

type RechargeRecordWithUser = RechargeRecords & {
  user?: RechargeRecordUser | null;
};

@Injectable()
export class RechargeRecordsService {
  constructor(
    @InjectRepository(RechargeRecords)
    private rechargeRecordsRepository: Repository<RechargeRecords>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: RechargeRecordSearchDto,
  ): Promise<{ list: RechargeRecordWithUser[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: FindOptionsWhere<RechargeRecords> = {};

    // 添加搜索条件
    if (searchDto?.uid !== undefined && searchDto?.uid !== null) {
      where.uid = searchDto.uid;
    }

    if (searchDto?.agentId !== undefined && searchDto?.agentId !== null) {
      where.agentId = searchDto.agentId;
    }

    const txHash = searchDto?.txId ?? searchDto?.txID;
    if (txHash !== undefined && txHash !== null && txHash !== "") {
      where.txId = txHash;
    }

    if (
      searchDto?.fromAddr !== undefined &&
      searchDto?.fromAddr !== null &&
      searchDto.fromAddr !== ""
    ) {
      where.fromAddr = Like(`%${searchDto.fromAddr}%`);
    }

    if (
      searchDto?.toAddr !== undefined &&
      searchDto?.toAddr !== null &&
      searchDto.toAddr !== ""
    ) {
      where.toAddr = Like(`%${searchDto.toAddr}%`);
    }

    if (searchDto?.type !== undefined && searchDto?.type !== null) {
      where.type = searchDto.type;
    }

    if (searchDto?.cate !== undefined && searchDto?.cate !== null) {
      // @ts-expect-error: cate 字段由实体定义
      where.cate = searchDto.cate;
    }

    // 时间范围查询
    const startAt = searchDto?.startAt;
    const endAt = searchDto?.endAt;
    if (startAt != null || endAt != null) {
      where.createdAt = Between(startAt ?? 0, endAt ?? Number.MAX_SAFE_INTEGER);
    }

    const [list, total] = await this.rechargeRecordsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { id: "DESC" },
    });

    if (!list.length) {
      return { list: [], total };
    }

    const userIds = Array.from(
      new Set(
        list
          .map((record) => record.uid)
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    let enrichedList: RechargeRecordWithUser[] = list.map((record) => ({
      ...record,
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
      enrichedList = enrichedList.map((record) => ({
        ...record,
        user: userMap.get(record.uid) ?? null,
      }));
    }

    return { list: enrichedList, total };
  }
}
