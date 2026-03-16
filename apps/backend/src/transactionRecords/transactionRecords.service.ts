import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from "typeorm";
import { TransactionRecordSearchDto } from "./dto/transaction-records.dto";
import { TransactionRecords } from "@database/index";
import { RemarkUtils, TRANSACTION_STATUS } from "@common/index";
import { BusinessException } from "../common/exceptions/business.exception";
@Injectable()
export class TransactionRecordsService {
  constructor(
    @InjectRepository(TransactionRecords)
    private transactionRecordsRepository: Repository<TransactionRecords>,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: TransactionRecordSearchDto,
  ): Promise<{ list: TransactionRecords[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: FindOptionsWhere<TransactionRecords> = {};

    // 添加搜索条件
    if (searchDto?.currency !== undefined && searchDto?.currency !== null) {
      where.currency = searchDto.currency;
    }

    if (searchDto?.txID !== undefined && searchDto?.txID !== null) {
      where.txId = searchDto.txID;
    }

    if (searchDto?.fromAddr !== undefined && searchDto?.fromAddr !== null) {
      where.fromAddr = searchDto.fromAddr;
    }

    if (searchDto?.toAddr !== undefined && searchDto?.toAddr !== null) {
      where.toAddr = searchDto.toAddr;
    }

    if (searchDto?.type !== undefined && searchDto?.type !== null) {
      where.type = searchDto.type;
    }

    if (searchDto?.status !== undefined && searchDto?.status !== null) {
      where.status = searchDto.status;
    }

    if (searchDto?.minAmount !== undefined && searchDto?.minAmount !== null) {
      where.amount = MoreThanOrEqual(searchDto.minAmount.toString());
    }

    if (searchDto?.maxAmount !== undefined && searchDto?.maxAmount !== null) {
      where.amount = LessThanOrEqual(searchDto.maxAmount.toString());
    }

    // 时间范围查询
    const startAt = searchDto?.startAt;
    const endAt = searchDto?.endAt;
    if (startAt != null || endAt != null) {
      where.createdAt = Between(startAt ?? 0, endAt ?? Number.MAX_SAFE_INTEGER);
    }

    const [list, total] = await this.transactionRecordsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { id: "DESC" },
    });

    return { list, total };
  }

  async ignore(id: number, remark: string): Promise<void> {
    if (!remark?.trim()) {
      throw new BusinessException(400, "备注不能为空");
    }

    console.log("转账记录忽略", id, remark);

    const nowInfo = await this.transactionRecordsRepository.findOne({
      where: { id, status: TRANSACTION_STATUS.PENDING },
    });

    if (!nowInfo) {
      throw new BusinessException(400, "此记录已处理或已忽略");
    }

    const payload = {
      status: TRANSACTION_STATUS.IGNORE,
      remark: RemarkUtils.addRemark(nowInfo.remark, remark),
    };

    await this.transactionRecordsRepository.update({ id }, payload);
  }
}
