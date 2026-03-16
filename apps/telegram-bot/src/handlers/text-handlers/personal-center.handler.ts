import { Injectable } from "@nestjs/common";
import TelegramBot from "node-telegram-bot-api";
import { User } from "@database/index";
import { UserService } from "../../services/user.service";
import { createMainMenuKeyboard } from "../../utils/keyboard.util";
import { ITextHandler } from "../interfaces/text-handler.interface";

import { MenuTextConstants } from "../../common/constants/menu-text.constants";

/**
 * 个人中心处理器
 */
@Injectable()
export class PersonalCenterHandler implements ITextHandler {
  constructor(private readonly userService: UserService) {}

  readonly name = "PersonalCenterHandler";
  readonly text = MenuTextConstants.PERSONAL_CENTER;

  /**
   * 处理个人中心消息
   */
  async execute(
    bot: TelegramBot,
    msg: TelegramBot.Message,
    user: User
  ): Promise<void> {
    const chatId = msg.chat.id;
    const mainMenuKeyboard = createMainMenuKeyboard();

    try {
      if (!user) {
        await bot.sendMessage(chatId, "未找到用户信息，请先使用 /start 命令", {
          reply_markup: mainMenuKeyboard,
        });
        return;
      }

      // 构建个人中心消息
      const message =
        `👤 个人中心\n\n` +
        `用户ID: ${user.id}\n` +
        `Telegram ID: ${user.telegramId || "未绑定"}\n` +
        `用户名: ${
          user.telegramUsername || user.telegramNickname || "未设置"
        }\n` +
        `余额: ${user.balance} TRX\n` +
        `钱包地址: ${user.walletAddr || "未绑定"}\n\n`;

      const personalCenterKeyboard = {
        inline_keyboard: [
          [
            { text: "💰 余额充值", callback_data: "rechargemenu:trx" },
            // { text: "📊 最近订单", callback_data: "recent_orders" },
          ],
        ],
      };

      await bot.sendMessage(chatId, message, {
        reply_markup: personalCenterKeyboard,
      });
    } catch (error) {
      await bot.sendMessage(chatId, "获取用户信息失败，请稍后重试", {
        reply_markup: mainMenuKeyboard,
      });
    }
  }
}
