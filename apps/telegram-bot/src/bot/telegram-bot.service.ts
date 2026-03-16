import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import TelegramBot from "node-telegram-bot-api";
import { CommandsService } from "../commands/commands.service";
import { MessageHandler } from "../handlers/message.handler";
import { CallbackHandler } from "../handlers/callback.handler";
import { UserService } from "../services/user.service";

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private bot: TelegramBot | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly commandsService: CommandsService,
    private readonly messageHandler: MessageHandler,
    private readonly callbackHandler: CallbackHandler,
    private readonly userService: UserService
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>("TELEGRAM_BOT_TOKEN");

    if (!token) {
      // eslint-disable-next-line no-console
      console.error(
        "TELEGRAM_BOT_TOKEN is not set. Telegram bot will not be started."
      );
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });

    this.registerHandlers(this.bot);

    // eslint-disable-next-line no-console
    console.log("Telegram bot started with polling mode");
  }

  async sendMessageToUser(telegramId: string, text: string): Promise<void> {
    if (!this.bot) {
      return;
    }
    const chatId = Number(telegramId);
    if (!Number.isFinite(chatId)) {
      return;
    }
    await this.bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }

  private registerHandlers(bot: TelegramBot) {
    // 1) 注册命令（/start /me 等）
    this.commandsService.registerCommands(bot);

    // 2) 消息处理（非命令文本）
    bot.on("message", async (msg) => {
      if (!msg.text || msg.text.startsWith("/")) {
        return;
      }
      // 仅处理私聊文本
      if (msg.chat?.type !== "private") {
        return;
      }

      const telegramId = msg.from?.id?.toString();
      if (!telegramId) {
        return;
      }

      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await bot.sendMessage(msg.chat.id, "请先使用 /start 初始化您的账户。");
        return;
      }

      await this.messageHandler.handle(bot as any, msg as any, user as any);
    });

    // 3) 回调（inline keyboard）
    bot.on("callback_query", async (query) => {
      // query.message 可能为空（例如 inline message），这里先做安全检查
      if (!query.message) {
        return;
      }
      if (query.message.chat?.type !== "private") {
        return;
      }

      const telegramId = query.from?.id?.toString();
      if (!telegramId) {
        return;
      }

      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await bot.sendMessage(
          query.message.chat.id,
          "请先使用 /start 初始化您的账户。"
        );
        return;
      }

      await this.callbackHandler.handle(bot as any, query as any, user as any);
    });

    bot.on("polling_error", (err) => {
      // eslint-disable-next-line no-console
      console.error("Telegram 网络波动", err);
    });
  }
}
