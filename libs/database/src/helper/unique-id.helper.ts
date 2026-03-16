import { Repository } from "typeorm";
import { UniqueId } from "../entities/entities/UniqueId";

/**
 * 在 unique_id 表中插入一条记录并返回自增 ID，多项目共用。
 * Nest 项目可封装为 UniqueIdService 注入 Repository<UniqueId> 后调用此方法。
 */
export async function createUniqueId(
  repo: Repository<UniqueId>
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const row = await repo.save({ createdAt: now });
  return row.id;
}
