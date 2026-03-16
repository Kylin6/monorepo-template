import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { ResourcePrice } from "@database/index";
import { BusinessException } from "../common/exceptions/business.exception";

@Injectable()
export class ResourcePriceService {
  constructor(
    @InjectRepository(ResourcePrice)
    private readonly resourcePriceRepository: Repository<ResourcePrice>
  ) {}

  async getResourcePrices(agentId?: string): Promise<ResourcePrice[]> {
    const where: FindOptionsWhere<ResourcePrice> = {};
    if (agentId !== undefined && agentId !== null && agentId !== "") {
      const agentIdNum = Number(agentId);
      if (Number.isNaN(agentIdNum)) {
        throw new BadRequestException("无效的 agentId");
      }
      where.agentId = agentIdNum;
    }

    return await this.resourcePriceRepository.find({
      where,
      order: { expireType: "ASC", expire: "ASC" },
    });
  }

  async batchSaveResourcePrice(
    // agentId: number,
    data: Array<{
      type: "B" | "E";
      expire: number;
      expireType: "D" | "H" | "M";
      price: string;
      // inPrice: string;
      status: number;
    }>
  ): Promise<ResourcePrice[]> {
    const now = Math.floor(Date.now() / 1000);
    const results: ResourcePrice[] = [];

    // 批量处理每个价格项
    for (const item of data) {
      // 将 type、expire、expireType 组合成 key
      const key = `${item.type}${item.expire}${item.expireType}`;

      // 查找是否已存在（根据 key ）
      const existing = await this.resourcePriceRepository.findOne({
        where: { key },
      });

      if (existing) {
        // 更新现有记录
        existing.price = item.price;
        // existing.inPrice = item.inPrice;
        existing.status = item.status;
        existing.updatedAt = now;
        await this.resourcePriceRepository.save(existing);
        results.push(existing);
      } else {
        // 创建新记录
        const newPrice = this.resourcePriceRepository.create({
          key,
          type: item.type,
          expire: item.expire,
          expireType: item.expireType,
          price: item.price,
          // inPrice: item.inPrice,
          status: item.status,
          updatedAt: now,
        });
        const saved = await this.resourcePriceRepository.save(newPrice);
        results.push(saved);
      }
    }

    return results;
  }

  async deleteById(id: number): Promise<void> {
    const existing = await this.resourcePriceRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new BusinessException(400, "资源价格不存在");
    }
    await this.resourcePriceRepository.remove(existing);
  }

  async updateStatus(id: number, status: number): Promise<void> {
    const existing = await this.resourcePriceRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new BusinessException(400, "资源价格不存在");
    }
    existing.status = status;
    await this.resourcePriceRepository.save(existing);
  }
}
