import { Injectable, Logger } from "@nestjs/common";
import { getUserRepository, type UserRepository, User } from "@database/index";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  private async repo(): Promise<UserRepository> {
    return getUserRepository();
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    const repo = await this.repo();
    return repo.findOne({ where: { telegramId } });
  }

  async findOrCreateByTelegramId(
    telegramId: string,
    telegramUsername?: string,
    telegramNickname?: string
  ): Promise<User> {
    const repo = await this.repo();

    const exists = await repo.findOne({ where: { telegramId } });
    if (exists) {
      // 补全 username/nickname（如果之前为空）
      let changed = false;
      if (!exists.telegramUsername && telegramUsername) {
        exists.telegramUsername = telegramUsername;
        changed = true;
      }
      if (!exists.telegramNickname && telegramNickname) {
        exists.telegramNickname = telegramNickname;
        changed = true;
      }
      if (changed) {
        await repo.save(exists);
      }
      return exists;
    }

    const user = repo.create({
      telegramId,
      telegramUsername: telegramUsername ?? null,
      telegramNickname: telegramNickname ?? null,
      balance: "0.00",
      status: 10,
    } as Partial<User>);

    const saved = await repo.save(user);
    this.logger.log(
      `Created user for telegramId=${telegramId}, id=${saved.id}`
    );
    return saved;
  }

  async updateWalletAddress(userId: number, walletAddr: string) {
    const repo = await this.repo();
    await repo.update({ id: userId }, { walletAddr });
  }
}
