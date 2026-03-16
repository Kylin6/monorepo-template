import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between, Like } from "typeorm";
import { AddrDesc } from "@database/index";
import { AddrDescSearchDto } from "./dto/addr-desc-search.dto";
import { CreateAddrDescDto } from "./dto/create-addr-desc.dto";
import { UpdateAddrDescDto } from "./dto/update-addr-desc.dto";

@Injectable()
export class AddrDescService {
  constructor(
    @InjectRepository(AddrDesc)
    private readonly addrDescRepository: Repository<AddrDesc>,
  ) {}

  async findAll(searchDto?: AddrDescSearchDto): Promise<AddrDesc[]> {
    // 构建查询条件
    const where: FindOptionsWhere<AddrDesc> = {};

    // 添加搜索条件
    if (searchDto?.addr !== undefined && searchDto?.addr !== null) {
      where.addr = Like(`%${searchDto.addr}%`);
    }

    // 时间范围查询
    const startAt = searchDto?.startAt;
    const endAt = searchDto?.endAt;
    if (startAt != null || endAt != null) {
      where.createdAt = Between(startAt ?? 0, endAt ?? Number.MAX_SAFE_INTEGER);
    }

    return this.addrDescRepository.find({
      where,
      order: { id: "DESC" },
    });
  }

  async addAddrDesc(dto: CreateAddrDescDto): Promise<void> {
    const existing = await this.addrDescRepository.findOne({
      where: { addr: dto.addr },
    });
    if (existing) {
      throw new BadRequestException("地址已存在");
    }
    const now = Math.floor(Date.now() / 1000);
    await this.addrDescRepository.save({
      addr: dto.addr,
      desc: dto.desc ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async editAddrDesc(dto: UpdateAddrDescDto): Promise<void> {
    const addrDesc = await this.addrDescRepository.findOne({
      where: { addr: dto.addr },
    });
    if (!addrDesc) {
      throw new NotFoundException("地址不存在");
    }
    const now = Math.floor(Date.now() / 1000);
    await this.addrDescRepository.update(addrDesc.id, {
      ...(dto.desc !== undefined && { desc: dto.desc }),
      updatedAt: now,
    });
  }

  async deleteAddrDesc(id: number): Promise<void> {
    const addrDesc = await this.addrDescRepository.findOne({
      where: { id },
    });
    if (!addrDesc) {
      throw new NotFoundException("地址不存在");
    }
    await this.addrDescRepository.delete(id);
  }
}
