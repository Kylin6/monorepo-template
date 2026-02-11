import { Injectable } from "@nestjs/common";
import { getUserRepository, User } from "@database/index";
import { UserSearchDto } from "./dto/user-search.dto";

export interface UserListResult {
  list: User[];
  total: number;
}

@Injectable()
export class UsersService {
  private async repo() {
    return getUserRepository();
  }

  async findById(id: number): Promise<User | null> {
    const repo = await this.repo();
    return repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const repo = await this.repo();
    return repo.findOne({ where: { email } });
  }

  /**
   * 分页 + 搜索用户列表（基于 UserSearchDto）
   */
  async listWithPagination(searchDto?: UserSearchDto): Promise<UserListResult> {
    const page = searchDto?.page ?? 1;
    const pageSize = searchDto?.pageSize ?? 10;
    const { id, name, startAt, endAt, status } = searchDto ?? {};
    const repo = await this.repo();
    const skip = (page - 1) * pageSize;

    const qb = repo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.email",
        "user.name",
        "user.avatar",
        "user.isActive",
        "user.createdAt",
        "user.updatedAt",
      ])
      .skip(skip)
      .take(pageSize)
      .orderBy("user.id", "DESC");

    if (id != null) {
      qb.andWhere("user.id = :id", { id });
    }
    if (name && name.trim()) {
      qb.andWhere("user.name LIKE :name", { name: `%${name.trim()}%` });
    }
    if (startAt != null) {
      qb.andWhere("user.createdAt >= :startAt", {
        startAt: new Date(startAt * 1000),
      });
    }
    if (endAt != null) {
      qb.andWhere("user.createdAt <= :endAt", {
        endAt: new Date(endAt * 1000),
      });
    }
    if (status != null) {
      qb.andWhere("user.isActive = :status", { status });
    }

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }
}
