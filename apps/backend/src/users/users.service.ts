import { Injectable } from '@nestjs/common';
import { getUserRepository, User } from '@database/index';

@Injectable()
export class UsersService {
  // Repository Service 模式：Service 内部持有 Repository，封装业务逻辑

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

  async listAll(): Promise<User[]> {
    const repo = await this.repo();
    return repo.find();
  }
}

