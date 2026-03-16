import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between } from "typeorm";
import { EnergyRecords, LeaseRecords } from "@database/index";
import {
  RemarkUtils,
  ENERGY_STATUS,
  RECLAIM_QUEUE_KEY,
  DELEGATE_QUEUE_KEY,
  IQueueSender,
  QUEUE_SENDER,
} from "@common/index";
import { EnergyRecordSearchDto } from "./dto/energy-records-search.dto";
import { EnergyManualDto } from "./dto/energy-manual.dto";
import { UniqueIdService } from "../database/unique-id.service";
import { BusinessException } from "../common/exceptions/business.exception";

@Injectable()
export class EnergyRecordsService {
  constructor(
    @InjectRepository(EnergyRecords)
    private energyRecordsRepository: Repository<EnergyRecords>,
    @InjectRepository(LeaseRecords)
    private leaseRecordRepository: Repository<LeaseRecords>,
    private uniqueIdService: UniqueIdService,
    @Inject(QUEUE_SENDER) private queueSender: IQueueSender,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: EnergyRecordSearchDto,
  ): Promise<{ list: EnergyRecords[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: FindOptionsWhere<EnergyRecords> = {};

    // 添加搜索条件
    if (searchDto?.resource !== undefined && searchDto?.resource !== null) {
      where.resource = searchDto.resource;
    }

    if (searchDto?.txID !== undefined && searchDto?.txID !== null) {
      where.txId = searchDto.txID;
    }

    if (searchDto?.type !== undefined && searchDto?.type !== null) {
      where.type = searchDto.type;
    }

    if (searchDto?.fromAddr !== undefined && searchDto?.fromAddr !== null) {
      where.fromAddr = searchDto.fromAddr;
    }

    if (searchDto?.toAddr !== undefined && searchDto?.toAddr !== null) {
      where.toAddr = searchDto.toAddr;
    }

    if (searchDto?.status !== undefined && searchDto?.status !== null) {
      where.status = searchDto.status;
    }

    // 时间范围查询
    const startAt = searchDto?.startAt;
    const endAt = searchDto?.endAt;
    if (startAt != null || endAt != null) {
      where.createdAt = Between(startAt ?? 0, endAt ?? Number.MAX_SAFE_INTEGER);
    }

    const [list, total] = await this.energyRecordsRepository.findAndCount({
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

    const nowInfo = await this.energyRecordsRepository.findOne({
      where: { id, status: ENERGY_STATUS.PENDING },
    });

    if (!nowInfo) {
      throw new BusinessException(400, "此记录已处理或已忽略");
    }

    const payload = {
      status: ENERGY_STATUS.IGNORE,
      remark: RemarkUtils.addRemark(nowInfo.remark, remark),
    };

    await this.energyRecordsRepository.update({ id }, payload);
  }

  async manualDelegate(body: EnergyManualDto): Promise<any> {
    const { amount, expire, expireType, from, operate, to, type } = body;
    const baseAmount = Number(amount);
    const now = Math.floor(Date.now() / 1000);
    const orderId = await this.uniqueIdService.createUniqueId();
    const order = this.leaseRecordRepository.create({
      orderId,
      uid: -100000,
      amount: baseAmount.toString(),
      expire,
      expireType: expireType ?? undefined,
      fromAddr: from ?? null,
      toAddr: to ?? null,
      type,
      status: 10,
      source: 41, // 41: 手动委托
      price: "0.00",
      cost: "0.00",
      agentPrice: "0.00",
      agentCost: "0.00",
      commission: "0.00",
      agentCommission: "0.00",
      netCost: "0.00",
      agentNetCost: "0.00",
      totalCost: "0.00",
      agentTotalCost: "0.00",
      balance: "0.00",
      remark: RemarkUtils.addRemark(null, body.remark ?? ""),
      createdAt: now,
    });
    // console.log(order, operate);
    await this.leaseRecordRepository.save(order);
    const queue =
      operate === "delegate" ? DELEGATE_QUEUE_KEY : RECLAIM_QUEUE_KEY;
    await this.queueSender.send(queue, { orderId });
  }
}
