import { Injectable } from "@nestjs/common";
import TelegramBot from "node-telegram-bot-api";
import { CommandRegistryService } from "./command-registry.service";

/**
 * 命令服务
 * 作为命令注册器的门面，提供统一的命令管理接口
 */
@Injectable()
export class CommandsService {
  constructor(private readonly commandRegistry: CommandRegistryService) {}

  /**
   * 注册所有命令到 Telegram Bot
   */
  registerCommands(bot: TelegramBot): void {
    this.commandRegistry.registerToBot(bot);
  }

  /**
   * 获取帮助信息
   */
  getHelpText(): string {
    return this.commandRegistry.getHelpText();
  }
}
