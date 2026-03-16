import type TelegramBot from "node-telegram-bot-api";
import { MenuTextConstants } from "../common/constants/menu-text.constants";

/**
 * 主菜单（底部持久键盘）
 * 注意：reply_keyboard_markup 结构与 inline_keyboard 不同
 */
export function createMainMenuKeyboard(): TelegramBot.ReplyKeyboardMarkup {
  return {
    keyboard: [
      [
        { text: MenuTextConstants.BUY_TRX },
        { text: MenuTextConstants.DURATION_LEASE },
        { text: MenuTextConstants.SHORTCUTS },
      ],
      [
        { text: MenuTextConstants.SMART_CUSTODY },
        { text: MenuTextConstants.PERSONAL_CENTER },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    selective: false,
    is_persistent: true, // 持久键盘
  };
}
