import { Injectable, Logger } from "@nestjs/common";
import TelegramBot = require("node-telegram-bot-api");
import { Message } from "node-telegram-bot-api";
import { User } from "@database/index";
import { ITextHandler } from "../interfaces/text-handler.interface";
import { TaskService } from "../../services/task.service";
import { UserService } from "../../services/user.service";
import { createMainMenuKeyboard } from "../../utils/keyboard.util";
import { TaskNameConstants } from "../../common/constants/menu-text.constants";

@Injectable()
export class AddressInputHandler implements ITextHandler {
  readonly name = "地址输入";
  readonly pattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/; // TRX 地址格式

  private readonly logger = new Logger(AddressInputHandler.name);
  constructor(
    private readonly taskService: TaskService,
    private readonly userService: UserService
  ) {}

  async execute(bot: TelegramBot, msg: Message, user: User): Promise<void> {
    const chatId = msg.chat.id;
    const address = msg.text;

    // 只有在任务状态为"等待地址"时才处理；否则忽略让其他逻辑接管
    const task = this.taskService.getTask(chatId);
    if (
      !this.taskService.hasTask(chatId) ||
      task?.name !== TaskNameConstants.TASK_BIND_ADDRESS
    ) {
      return;
    }

    this.logger.debug(
      `处理地址输入 (chatId: ${chatId}, address: ${address}, user: ${user.id})`
    );

    // 验证地址格式
    if (!this.pattern.test(address || "")) {
      // 格式不正确，提示错误但不关闭任务，让用户可以重新输入
      const closeKeyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [[{ text: "❌ 关闭", callback_data: "cancel_task" }]],
      };
      await bot.sendMessage(
        chatId,
        "❌ 地址格式不正确，请发送有效的钱包地址。\n\n请重新发送正确的钱包地址，或点击关闭按钮结束当前任务。",
        {
          parse_mode: "Markdown",
          reply_markup: closeKeyboard,
        }
      );
      return;
    }

    // 格式正确，处理地址绑定
    const telegramId = msg.from?.id?.toString();

    if (!telegramId) {
      this.logger.warn(`无法获取用户 telegramId (chatId: ${chatId})`);
      await bot.sendMessage(chatId, "❌ 无法识别用户信息，请重试。");
      this.taskService.clearTask(chatId);
      return;
    }

    try {
      // 查找当前用户
      const currentUser = await this.userService.findByTelegramId(telegramId);

      if (!currentUser) {
        this.logger.warn(`用户不存在 (telegramId: ${telegramId})`);
        await bot.sendMessage(
          chatId,
          "❌ 用户信息不存在，请先使用 /start 命令初始化。"
        );
        this.taskService.clearTask(chatId);
        return;
      }

      // 更新用户钱包地址
      await this.userService.updateWalletAddress(currentUser.id, address!);

      await bot.sendMessage(chatId, `✅ 钱包地址已成功绑定：\n\`${address}\``, {
        parse_mode: "Markdown",
        reply_markup: createMainMenuKeyboard(),
      });
    } catch (error) {
      this.logger.error(
        `保存钱包地址失败 (telegramId: ${telegramId}, address: ${address}):`,
        error
      );
      const closeKeyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
          [{ text: "重新绑定", callback_data: "updatemyaddr:0" }],
        ],
      };
      await bot.sendMessage(
        chatId,
        `❌ 绑定地址失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
        {
          parse_mode: "HTML",
          reply_markup: closeKeyboard,
        }
      );
    }

    // 完成后清除任务状态
    this.taskService.clearTask(chatId);
  }
}
