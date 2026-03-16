import { Injectable, Logger } from "@nestjs/common";
import TelegramBot from "node-telegram-bot-api";
import { Message } from "node-telegram-bot-api";
import { ICommandHandler } from "./interfaces/command-handler.interface";
import { StartCommand } from "./handlers/start.command";
import { MeCommand } from "./handlers/me.command";
import { UserService } from "../services/user.service";

/**
 * 命令注册器服务
 * 负责管理和注册所有命令处理器
 */
@Injectable()
export class CommandRegistryService {
  private readonly logger = new Logger(CommandRegistryService.name);
  private readonly commands: Map<string, ICommandHandler> = new Map();

  constructor(
    private readonly startCommand: StartCommand,
    private readonly meCommand: MeCommand,
    private readonly userService: UserService
  ) {
    // 注册所有命令
    this.registerCommand(this.startCommand);
    this.registerCommand(this.meCommand);
  }

  /**
   * 注册命令处理器
   */
  private registerCommand(handler: ICommandHandler): void {
    if (this.commands.has(handler.command)) {
      this.logger.warn(`命令 "${handler.command}" 已存在，将被覆盖`);
    }
    this.commands.set(handler.command, handler);
    this.logger.debug(`已注册命令: /${handler.command}`);
  }

  /**
   * 获取所有已注册的命令
   */
  getAllCommands(): ICommandHandler[] {
    return Array.from(this.commands.values());
  }

  /**
   * 根据命令名称获取处理器
   */
  getCommand(command: string): ICommandHandler | undefined {
    return this.commands.get(command);
  }

  /**
   * 注册所有命令到 Telegram Bot
   */
  registerToBot(bot: TelegramBot): void {
    for (const handler of this.commands.values()) {
      bot.onText(handler.pattern, async (msg) => {
        const isPrivateChat = msg.chat?.type === "private";
        // 默认只在私聊响应，/me 允许在群组中使用
        if (!isPrivateChat && handler.command !== "me") {
          return;
        }

        this.logger.debug(
          `收到命令 /${handler.command} from chatId: ${msg.chat.id}`
        );

        try {
          const telegramId = msg.from?.id?.toString();
          if (!telegramId) {
            this.logger.warn(`无法获取 telegramId from chatId: ${msg.chat.id}`);
            return;
          }

          // 只有 /start 命令才创建用户，其他命令只查找用户
          let user;
          if (handler.command === "start") {
            // /start 命令：查找或创建用户
            user = await this.userService.findOrCreateByTelegramId(
              telegramId,
              msg.from?.username || undefined,
              msg.from?.first_name || undefined
            );
          } else {
            // 其他命令：只查找用户，不存在则提示
            user = await this.userService.findByTelegramId(telegramId);
            if (!user) {
              await bot.sendMessage(
                msg.chat.id,
                "请先使用 /start 命令初始化您的账户。"
              );
              return;
            }
          }

          // 执行命令处理器
          const result = handler.handle(bot, msg, user);
          // 如果是 Promise，捕获错误
          if (result instanceof Promise) {
            result.catch((error) => {
              this.logger.error(`命令 /${handler.command} 处理失败:`, error);
            });
          }
        } catch (error) {
          this.logger.error(`命令 /${handler.command} 处理失败:`, error);
        }
      });
    }

    // 注册通用命令处理器：处理所有未定义的命令，自动执行 /start
    bot.onText(/^\/(.+)$/, async (msg, match) => {
      // 仅处理私聊
      if (msg.chat?.type !== "private") {
        return;
      }

      const commandName = match?.[1];
      if (!commandName) {
        return;
      }

      const fullCommandText = `/${commandName}`;

      // 检查是否是已注册的命令
      const handler =
        this.getCommand(commandName) ||
        Array.from(this.commands.values()).find((cmd) =>
          cmd.pattern.test(fullCommandText)
        );

      if (handler) {
        // 已注册的命令由上面的 onText 处理，这里不处理
        return;
      }

      // 未定义的命令，执行 /start
      this.logger.debug(
        `收到未定义的命令 /${commandName}，自动执行 /start from chatId: ${msg.chat.id}`
      );

      try {
        const telegramId = msg.from?.id?.toString();
        if (!telegramId) {
          return;
        }

        // 未定义的命令自动执行 /start，此时创建用户
        const user = await this.userService.findOrCreateByTelegramId(
          telegramId,
          msg.from?.username || undefined,
          msg.from?.first_name || undefined
        );

        const result = this.startCommand.handle(bot, msg, user);
        if (result instanceof Promise) {
          result.catch((error) => {
            this.logger.error(`执行 /start 命令失败:`, error);
          });
        }
      } catch (error) {
        this.logger.error(`执行 /start 命令失败:`, error);
      }
    });

    this.logger.log(`已注册 ${this.commands.size} 个命令到机器人`);
  }

  /**
   * 获取帮助信息
   */
  getHelpText(): string {
    const commands = Array.from(this.commands.values())
      .map((cmd) => `/${cmd.command} - ${cmd.description}`)
      .join("\n");
    return `可用命令：\n\n${commands}`;
  }
}
