import TelegramBot from "node-telegram-bot-api";
import { Logger } from "@nestjs/common";

export class ErrorHandlerUtil {
  static toMessage(err: unknown, fallback = "系统错误，请稍后重试"): string {
    if (err instanceof Error) {
      return err.message || fallback;
    }
    return fallback;
  }

  static async handleError(
    bot: TelegramBot,
    chatId: number,
    err: unknown,
    options?: {
      queryId?: string;
      logger?: Logger;
      useAlert?: boolean;
    }
  ): Promise<void> {
    const message = this.toMessage(err);

    if (options?.logger) {
      options.logger.error("处理 Telegram 请求失败", err);
    }

    if (options?.queryId) {
      try {
        await bot.answerCallbackQuery(options.queryId, {
          text: message,
          show_alert: options.useAlert ?? true,
        });
      } catch {
        // ignore
      }
    }

    try {
      await bot.sendMessage(chatId, `❌ ${message}`);
    } catch {
      // ignore
    }
  }
}
