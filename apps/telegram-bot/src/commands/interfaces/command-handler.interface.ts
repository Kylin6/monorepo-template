import TelegramBot = require("node-telegram-bot-api");
import { Message } from "node-telegram-bot-api";

/**
 * 命令处理器接口
 */
export interface ICommandHandler {
  /**
   * 命令名称（如 "start", "hello"）
   */
  readonly command: string;

  /**
   * 命令描述（用于帮助信息）
   */
  readonly description: string;

  /**
   * 命令匹配的正则表达式
   */
  readonly pattern: RegExp;

  /**
   * 处理命令
   */
  handle(bot: TelegramBot, msg: Message): Promise<void> | void;
}
