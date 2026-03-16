import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UniqueId, createUniqueId } from "@database/index";

/**
 * 在 unique_id 表插入一条记录并返回自增 ID，供多模块使用。
 * 逻辑在 @database 的 createUniqueId，此处仅做 Nest 注入封装。
 */
@Injectable()
export class UniqueIdService {
  constructor(
    @InjectRepository(UniqueId)
    private readonly repo: Repository<UniqueId>
  ) {}

  async createUniqueId(): Promise<number> {
    return createUniqueId(this.repo);
  }
}
