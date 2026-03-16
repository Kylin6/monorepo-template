import { Injectable, Logger } from "@nestjs/common";
import TelegramBot from "node-telegram-bot-api";
import { Message } from "node-telegram-bot-api";
import { User } from "@database/index";
import { ICommandHandler } from "../interfaces/command-handler.interface";

@Injectable()
export class MeCommand implements ICommandHandler {
  readonly command = "me";
  readonly description = "查看当前用户信息";
  readonly pattern = /\/me/;

  private readonly logger = new Logger(MeCommand.name);

  handle(bot: TelegramBot, msg: Message, user: User): void {
    const chatId = msg.chat.id;
    const message =
      `当前窗口ID: <code>${chatId}</code>\n` +
      `用户ID: <code>${user.id}</code>\n` +
      `Telegram ID: <code>${user.telegramId || "未绑定"}</code>\n` +
      `用户名: ${user.telegramUsername || user.telegramNickname || "未设置"}`;

    bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
    });
  }
}
