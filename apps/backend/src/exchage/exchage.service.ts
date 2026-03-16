import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Exchange } from "@database/index";
import { ExchangeSearchDto } from "./dto/exchage-search.dto";

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(Exchange)
    private exchangeRepository: Repository<Exchange>
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: ExchangeSearchDto
  ): Promise<{ list: Exchange[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 使用 QueryBuilder 构建查询
    const queryBuilder = this.exchangeRepository.createQueryBuilder("exchange");

    // 交易hash查询（支持 transferInTxId 或 transferOutTxId）
    if (searchDto?.txID !== undefined && searchDto?.txID !== null) {
      queryBuilder.andWhere(
        "(exchange.transferInTxId = :txID OR exchange.transferOutTxId = :txID)",
        { txID: searchDto.txID }
      );
    }

    // 发送地址模糊搜索
    if (
      searchDto?.fromAddr !== undefined &&
      searchDto?.fromAddr !== null &&
      searchDto.fromAddr !== ""
    ) {
      queryBuilder.andWhere("exchange.from LIKE :fromAddr", {
        fromAddr: `%${searchDto.fromAddr}%`,
      });
    }

    // 接收地址模糊搜索
    if (
      searchDto?.toAddr !== undefined &&
      searchDto?.toAddr !== null &&
      searchDto.toAddr !== ""
    ) {
      queryBuilder.andWhere("exchange.to LIKE :toAddr", {
        toAddr: `%${searchDto.toAddr}%`,
      });
    }

    // 时间范围查询（使用 createdAt）
    if (searchDto?.startAt && searchDto?.endAt) {
      queryBuilder.andWhere("exchange.createdAt BETWEEN :startAt AND :endAt", {
        startAt: searchDto.startAt,
        endAt: searchDto.endAt,
      });
    } else if (searchDto?.startAt) {
      queryBuilder.andWhere("exchange.createdAt >= :startAt", {
        startAt: searchDto.startAt,
      });
    } else if (searchDto?.endAt) {
      queryBuilder.andWhere("exchange.createdAt <= :endAt", {
        endAt: searchDto.endAt,
      });
    }

    // 排序和分页
    queryBuilder.orderBy("exchange.id", "DESC");
    queryBuilder.skip(skip);
    queryBuilder.take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return { list, total };
  }
}
