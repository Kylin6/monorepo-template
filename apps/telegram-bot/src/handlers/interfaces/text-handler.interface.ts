import TelegramBot = require("node-telegram-bot-api");
import { Message } from "node-telegram-bot-api";
import { User } from "@database/index";

/**
 * 文本消息处理器接口
 */
export interface ITextHandler {
  /**
   * 处理器名称（用于识别和日志）
   */
  readonly name: string;

  /**
   * 匹配的文本内容（精确匹配）
   * 如果提供了 pattern，则此字段可选
   */
  readonly text?: string;

  /**
   * 或者使用正则表达式匹配（如果提供，优先使用正则）
   */
  readonly pattern?: RegExp;

  /**
   * 执行处理逻辑
   */
  execute(bot: TelegramBot, msg: Message, user: User): Promise<void>;
}
