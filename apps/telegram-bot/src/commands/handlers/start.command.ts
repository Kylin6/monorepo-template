import { Injectable, Logger } from "@nestjs/common";
import TelegramBot from "node-telegram-bot-api";
import { Message } from "node-telegram-bot-api";
import { User } from "@database/index";
import { ICommandHandler } from "../interfaces/command-handler.interface";
import { createMainMenuKeyboard } from "../../utils/keyboard.util";

/**
 * Start 命令处理器
 */
@Injectable()
export class StartCommand implements ICommandHandler {
  readonly command = "start";
  readonly description = "启动机器人，显示欢迎界面";
  readonly pattern = /^\/start(?:\s|$)/;

  private readonly logger = new Logger(StartCommand.name);

  async handle(bot: TelegramBot, msg: Message, user: User): Promise<void> {
    const chatId = msg.chat.id;
    const userName = msg.from?.first_name || msg.from?.username || "用户";

    // 提取 start 参数（来自分享链接，格式：/start 参数）
    let source: string | null = null;
    if (msg.text) {
      const match = msg.text.match(/^\/start\s+(.+)$/);
      if (match && match[1]) {
        source = match[1].trim();
        // this.logger.debug(`检测到来源参数: "${source}"`);
      }
    }

    try {


      const support = "@trxenio";
      const channel = "https://t.me/trxen_io";
      // 发送欢迎消息
      const welcomeMessage =
        "🔥<b>【TRX能量神器上线！秒速到账，省下80%成本！】</b>🔥\n\n" +
        `【超能机器人-旗舰版】，1秒极速到账，操作简单无需等待！⏰\n\n` +
        "▪️ TRX 兑换：最高汇率，兑换秒到账\n" +
        `▪️ 能量闪租：转TRX即可免费一笔转账\n` +
        `▪️ 智能托管：智能分辨上能量\n` +
        "💡 无论是高频交易还是紧急需求，一单搞定，再也不用担心卡顿！\n\n" +
        `✨ 贴心客服:${support}\n` +
        `✨ 官方频道:${channel}\n` +
        "🚀 告别高成本，拥抱流畅交易！";

      // 设置持久键盘菜单
      const mainMenuKeyboard = createMainMenuKeyboard();
      await bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard,
        disable_web_page_preview: true,
      });

      this.logger.log(
        `用户 ${user?.telegramId || msg.from?.id} 启动机器人 (source=${
          source || "-"
        })`
      );
    } catch (error) {
      this.logger.error(`发送欢迎消息失败 (chatId: ${chatId}):`, error);
      // 如果出错，至少发送一个简单的欢迎消息
      await bot.sendMessage(chatId, `欢迎使用机器人！`);
    }
  }
}
