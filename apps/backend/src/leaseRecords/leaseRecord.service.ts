import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  FindOptionsWhere,
  Between,
  Like,
  In,
  DataSource,
} from "typeorm";
import {
  LeaseRecords,
  User,
  Agent,
  Funds,
  EnergyRecords,
  AuthorizedWallet,
  FUNDS_CATE,
  FUNDS_TYPE,
  LEASE_RECORDS_STATUS,
  type LeaseRecordsStatusValue,
  LEASE_RECORDS_RECLAIM_TYPE,
  type LeaseRecordsReclaimTypeValue,
} from "@database/index";
import {
  RECLAIM_QUEUE_KEY,
  RemarkUtils,
  IQueueSender,
  QUEUE_SENDER,
  ENERGY_STATUS,
} from "@common/index";
import { LeaseRecordSearchDto } from "./dto/lease-record-search.dto";
import { UniqueIdService } from "../database/unique-id.service";

import { BusinessException } from "../common/exceptions/business.exception";

type LeaseRecordUser = Pick<
  User,
  "id" | "username" | "nickname" | "email" | "telegramNickname" | "telegramId"
>;

type LeaseRecordWithUser = LeaseRecords & { user?: LeaseRecordUser | null };

@Injectable()
export class LeaseRecordService {
  constructor(
    @InjectRepository(LeaseRecords)
    private leaseRecordRepository: Repository<LeaseRecords>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Funds)
    private readonly fundsRepository: Repository<Funds>,
    @InjectRepository(EnergyRecords)
    private readonly energyRecordRepository: Repository<EnergyRecords>,
    @InjectRepository(AuthorizedWallet)
    private readonly authorizedWalletRepository: Repository<AuthorizedWallet>,
    private readonly dataSource: DataSource,
    private readonly uniqueIdService: UniqueIdService,
    @Inject(QUEUE_SENDER) private readonly queueSender: IQueueSender,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: LeaseRecordSearchDto,
  ): Promise<{ list: LeaseRecordWithUser[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: FindOptionsWhere<LeaseRecords> = {};

    // 添加搜索条件
    if (searchDto?.orderId !== undefined && searchDto?.orderId !== null) {
      where.orderId = searchDto.orderId;
    }
    if (searchDto?.uid !== undefined && searchDto?.uid !== null) {
      where.uid = searchDto.uid;
    }

    if (searchDto?.agentId !== undefined && searchDto?.agentId !== null) {
      where.agentId = searchDto.agentId;
    }

    if (searchDto?.type !== undefined && searchDto?.type !== null) {
      where.type = searchDto.type;
    }

    if (
      searchDto?.txId !== undefined &&
      searchDto?.txId !== null &&
      searchDto.txId !== ""
    ) {
      where.txId = searchDto.txId;
    }

    if (searchDto?.status !== undefined && searchDto?.status !== null) {
      where.status = searchDto.status;
    }

    if (searchDto?.source !== undefined && searchDto?.source !== null) {
      where.source = searchDto.source;
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

    // 时间范围查询
    const startAt = searchDto?.startAt;
    const endAt = searchDto?.endAt;
    if (startAt != null || endAt != null) {
      where.createdAt = Between(startAt ?? 0, endAt ?? Number.MAX_SAFE_INTEGER);
    }

    const [list, total] = await this.leaseRecordRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { orderId: "DESC" },
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

    let enrichedList: LeaseRecordWithUser[] = list.map((record) => ({
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

  async reclaim(orderId: number): Promise<any> {
    // const leaseRecordStatus = LEASE_RECORDS_STATUS as Record<
    //   string,
    //   LeaseRecordsStatusValue
    // >;
    // const leaseRecordReclaimType = LEASE_RECORDS_RECLAIM_TYPE as Record<
    //   string,
    //   LeaseRecordsReclaimTypeValue
    // >;

    const allowedStatuses: LeaseRecordsStatusValue[] = [
      LEASE_RECORDS_STATUS.DELEGATED,
      LEASE_RECORDS_STATUS.RECLAIM_UNKNOWN,
      LEASE_RECORDS_STATUS.RECLAIM_FAILED,
    ];

    const record = await this.leaseRecordRepository.findOne({
      where: {
        orderId,
        locked: 0,
        status: In(allowedStatuses),
      },
    });

    if (!record) {
      throw new BusinessException(400, "此订单已被回收或被锁定,暂时无法回收");
    }

    try {
      await this.leaseRecordRepository.update(
        { orderId },
        {
          reclaimType: LEASE_RECORDS_RECLAIM_TYPE.MANUAL,
          status: LEASE_RECORDS_STATUS.DELEGATED,
        },
      );

      await this.queueSender.send(RECLAIM_QUEUE_KEY, {
        orderId: orderId,
      });
      return null;
    } catch (error) {
      throw new BusinessException(
        400,
        `手动回收失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  async cancel(orderId: number): Promise<any> {
    const leaseRecordStatus = LEASE_RECORDS_STATUS as Record<
      string,
      LeaseRecordsStatusValue
    >;

    const allowedStatuses: LeaseRecordsStatusValue[] = [
      leaseRecordStatus.PAYED,
      leaseRecordStatus.BROADCASTED,
      leaseRecordStatus.UNKNOWN,
    ];

    const record = await this.leaseRecordRepository.findOne({
      where: {
        orderId,
        locked: 0,
        status: In(allowedStatuses),
      },
    });

    if (!record) {
      throw new BadRequestException("该记录不存在或已被删除");
    }

    // 开启事务
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 修改订单状态
      await queryRunner.manager.update(
        LeaseRecords,
        { orderId },
        {
          status: leaseRecordStatus.DENY,
        },
      );

      // 2. 检查金额是否大于0，然后退回用户和代理的余额
      const totalCost = parseFloat(record.totalCost || "0");
      const agentTotalCost = parseFloat(record.agentTotalCost || "0");
      const now = Math.floor(Date.now() / 1000);

      // 退回用户余额
      if (totalCost > 0 && record.uid) {
        // 获取用户当前余额
        const user = await queryRunner.manager.findOne(User, {
          where: { id: record.uid },
        });

        if (user) {
          const newUserBalance =
            Math.round((parseFloat(user.balance) + totalCost) * 100) / 100;

          // 增加用户余额
          await queryRunner.manager.increment(
            User,
            { id: record.uid },
            "balance",
            totalCost,
          );

          // 创建用户资金账变记录
          const userFundsId = await this.uniqueIdService.createUniqueId();
          const userFunds = queryRunner.manager.create(Funds, {
            id: userFundsId,
            uid: record.uid,
            agentId: record.agentId,
            cate: FUNDS_CATE.BUYER,
            type: FUNDS_TYPE.CANCEL_ORDER,
            currency: "TRX",
            exchange: "1.000",
            orderId: orderId,
            amount: totalCost.toFixed(2),
            realAmount: totalCost.toFixed(2),
            balance: newUserBalance.toFixed(2),
            remark: RemarkUtils.addRemark(null, `订单 ${orderId} 取消退款`),
            createdAt: now,
          });
          await queryRunner.manager.save(userFunds);
        }
      }

      // 退回代理余额
      if (agentTotalCost > 0 && record.agentId) {
        // 获取代理当前余额
        const agent = await queryRunner.manager.findOne(Agent, {
          where: { uid: record.agentId },
        });

        if (agent) {
          const newAgentBalance =
            Math.round((parseFloat(agent.balance) + agentTotalCost) * 100) /
            100;

          // 增加代理余额
          await queryRunner.manager.increment(
            Agent,
            { uid: record.agentId },
            "balance",
            agentTotalCost,
          );

          // 创建代理资金账变记录
          const agentFundsId = await this.uniqueIdService.createUniqueId();
          const agentFunds = queryRunner.manager.create(Funds, {
            id: agentFundsId,
            uid: record.agentId,
            agentId: record.agentId,
            cate: FUNDS_CATE.PRIVATE_AGENT,
            type: FUNDS_TYPE.CANCEL_ORDER,
            currency: "TRX",
            exchange: "1.000",
            orderId: orderId,
            amount: agentTotalCost.toFixed(2),
            realAmount: agentTotalCost.toFixed(2),
            balance: newAgentBalance.toFixed(2),
            remark: RemarkUtils.addRemark(null, `订单 ${orderId} 取消退款`),
            createdAt: now,
          });
          await queryRunner.manager.save(agentFunds);
        }
      }

      // 提交事务
      await queryRunner.commitTransaction();

      return null;
    } catch (error) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      throw new BusinessException(
        400,
        `取消订单失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    } finally {
      // 释放连接
      await queryRunner.release();
    }
  }

  async reclaimConfirm(orderId: number, txId: string): Promise<any> {
    const leaseRecordStatus = LEASE_RECORDS_STATUS as Record<
      string,
      LeaseRecordsStatusValue
    >;
    const allowedStatuses: LeaseRecordsStatusValue[] = [
      leaseRecordStatus.RECLAIM_UNKNOWN,
      leaseRecordStatus.RECLAIM_FAILED,
    ];
    if (!txId || txId.trim() === "") {
      throw new BusinessException(400, "交易哈希不能为空");
    }

    const record = await this.leaseRecordRepository.findOne({
      where: {
        orderId,
        locked: 0,
        status: In(allowedStatuses),
      },
    });

    if (!record) {
      throw new BusinessException(400, "此订单已被回收或被锁定,暂时无法回收");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const energyRecord = await queryRunner.manager.findOne(EnergyRecords, {
        where: {
          txId,
          fromAddr: record.fromAddr ?? undefined,
          toAddr: record.toAddr ?? undefined,
          resource: record.type,
          type: "UNDELEGATE",
          status: In([ENERGY_STATUS.PENDING, ENERGY_STATUS.IGNORE]),
        },
        lock: { mode: "pessimistic_write" },
      });

      if (!energyRecord) {
        throw new BadRequestException(`${txId}此交易记录不存在或已被处理`);
      }

      const now = Math.floor(Date.now() / 1000);

      // 修改订单状态为待回收
      await queryRunner.manager.update(
        LeaseRecords,
        { orderId },
        {
          status: leaseRecordStatus.WAITING_RECLAIMED,
          reclaimedAt: now,
          reclaimTxId: txId,
        },
      );

      await queryRunner.commitTransaction();
      return null;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BusinessException(
        400,
        `确认回收失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async delegateConfirm(orderId: number, txId: string): Promise<any> {
    const leaseRecordStatus = LEASE_RECORDS_STATUS as Record<
      string,
      LeaseRecordsStatusValue
    >;
    const allowedStatuses: LeaseRecordsStatusValue[] = [
      leaseRecordStatus.UNKNOWN,
      leaseRecordStatus.PAYED,
    ];
    if (!txId || txId.trim() === "") {
      throw new BusinessException(400, "交易哈希不能为空");
    }

    const record = await this.leaseRecordRepository.findOne({
      where: {
        orderId,
        locked: 0,
        status: In(allowedStatuses),
      },
    });

    if (!record) {
      throw new BusinessException(400, "此订单已被回收或被锁定,暂时无法回收");
    }

    try {
      const energyRecord = await this.energyRecordRepository.findOne({
        where: {
          txId,
          toAddr: record.toAddr ?? undefined,
          resource: record.type,
          type: "DELEGATE",
          status: In([ENERGY_STATUS.PENDING, ENERGY_STATUS.IGNORE]),
        },
      });
      if (!energyRecord) {
        throw new BusinessException(400, `${txId}回收记录不存在`);
      }
      const wallet = await this.authorizedWalletRepository.findOne({
        where: {
          type: 20, // 卖家钱包
          addr: energyRecord.fromAddr ?? undefined,
        },
      });
      if (!wallet) {
        throw new BusinessException(400, `${energyRecord.fromAddr}钱包不存在`);
      }

      // 修改订单状态为待回收
      await this.leaseRecordRepository.update(
        { orderId },
        {
          txId: energyRecord.txId,
          sellerId: wallet.id,
          fromAddr: energyRecord.fromAddr,
          locked: wallet.lock,
          platform: wallet.type,
          stakeAmount: (energyRecord.stakeAmount ?? 0).toString(),
          stakeRate: (() => {
            const stakeAmountNum = Number(energyRecord.stakeAmount) || 0;
            if (stakeAmountNum === 0) return "0";
            const rate = Math.abs(Number(energyRecord.amount)) / stakeAmountNum;
            return rate.toFixed(2);
          })(),
          status: leaseRecordStatus.BROADCASTED,
        },
      );
    } catch (error) {
      throw new BusinessException(
        400,
        `确认已代理失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }
}
