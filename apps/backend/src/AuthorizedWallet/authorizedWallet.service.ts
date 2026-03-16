import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between } from "typeorm";
import { AuthorizedWallet } from "@database/index";
import { AuthorizedWalletSearchDto } from "./dto/authorizedWallet-search.dto";
import { AuthorizedWalletUpdateDto } from "./dto/authorizedWallet-update.dto";

@Injectable()
export class AuthorizedWalletService {
  constructor(
    @InjectRepository(AuthorizedWallet)
    private authorizedWalletRepository: Repository<AuthorizedWallet>,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    searchDto?: AuthorizedWalletSearchDto,
  ): Promise<{ list: AuthorizedWallet[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: FindOptionsWhere<AuthorizedWallet> = {};

    // 添加搜索条件
    if (searchDto?.uid !== undefined && searchDto?.uid !== null) {
      where.uid = searchDto.uid;
    }

    if (searchDto?.type !== undefined && searchDto?.type !== null) {
      where.type = searchDto.type;
    }

    if (searchDto?.addr !== undefined && searchDto?.addr !== null) {
      where.addr = searchDto.addr;
    }

    if (searchDto?.lock !== undefined && searchDto?.lock !== null) {
      where.lock = searchDto.lock;
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

    const [list, total] = await this.authorizedWalletRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { sort: "DESC", id: "DESC" },
    });

    return { list, total };
  }

  async setTop(id: number): Promise<void> {
    const now = Date.now() / 1000;
    await this.authorizedWalletRepository.update(id, { sort: now });
  }

  async update(id: number, dto: AuthorizedWalletUpdateDto): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    // 将数组转为逗号分隔字符串；空数组时更新为 null，未提供则不更新
    const buildCsv = (arr?: number[]): string | null | undefined => {
      if (!Array.isArray(arr)) return undefined; // 未提供
      if (arr.length === 0) return null; // 显式置空
      return arr.join(",");
    };

    const payload: Partial<AuthorizedWallet> = { updatedAt: now };

    if (dto.status !== undefined) {
      payload.status = dto.status;
    }
    if (dto.lock !== undefined) {
      payload.lock = dto.lock;
    }

    const allowExpireCsv = buildCsv(dto.allowExpire);
    if (allowExpireCsv !== undefined) {
      payload.allowExpire = allowExpireCsv;
    }

    const allowBandwidthExpireCsv = buildCsv(dto.allowBandwidthExpire);
    if (allowBandwidthExpireCsv !== undefined) {
      payload.allowBandwidthExpire = allowBandwidthExpireCsv;
    }

    if (dto.remark !== undefined) {
      payload.remark = dto.remark;
    }

    await this.authorizedWalletRepository.update({ id }, payload);
  }
}
