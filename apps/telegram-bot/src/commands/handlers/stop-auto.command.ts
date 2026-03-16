import { Injectable, Logger } from "@nestjs/common";
import TelegramBot, { Message } from "node-telegram-bot-api";
import { ICommandHandler } from "../interfaces/command-handler.interface";
import { OrderService } from "../../services/order.service";
import { UserService } from "../../services/user.service";

@Injectable()
export class StopAutoCommand implements ICommandHandler {
  readonly command = "stopauto";
  readonly description = "停止智能托管";
  readonly pattern = /^\/stopauto(\d+)$/i;

  private readonly logger = new Logger(StopAutoCommand.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly userService: UserService
  ) {}

  async handle(bot: TelegramBot, msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const match = msg.text?.match(this.pattern);

    if (!match) {
      await bot.sendMessage(chatId, "❌ 命令格式错误，请使用 /stopautoXX");
      return;
    }

    const planId = Number(match[1]);
    if (!planId) {
      await bot.sendMessage(chatId, "❌ 智能托管编号无效，请重新输入。");
      return;
    }

    try {
      const telegramId = msg.from?.id?.toString();
      if (!telegramId) {
        await bot.sendMessage(chatId, "❌ 无法获取用户信息，请稍后重试。");
        return;
      }
      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          "❌ 未找到您的用户信息，请先使用 /start 初始化。"
        );
        return;
      }

      const plan = await this.orderService.stopPlanOrder(planId, user.id);
      await bot.sendMessage(
        chatId,
        `✅ 已停止智能托管\n地址: <code>${plan?.toAddr || "未知地址"}</code>`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      this.logger.error(`停止智能托管失败 (planId: ${planId}):`, error);
      await bot.sendMessage(
        chatId,
        `❌ 停止失败。${error instanceof Error ? error.message : ""}`
      );
    }
  }
}
