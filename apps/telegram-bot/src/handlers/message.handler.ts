import { Injectable, Logger } from "@nestjs/common";
import TelegramBot = require("node-telegram-bot-api");
import { Message } from "node-telegram-bot-api";
import { TextHandlerRegistryService } from "./text-handler-registry.service";
import { CommandRegistryService } from "../commands/command-registry.service";
import { TaskService } from "../services/task.service";
import { User } from "@database/index";
import { TaskNameConstants } from "../common/constants/menu-text.constants";
import { RechargeHandler } from "./text-handlers/recharge.handler";
import { DurationLeaseHandler } from "./text-handlers/duration-lease.handler";
import { SmartCustodyHandler } from "./text-handlers/smart-custody.handler";
@Injectable()
export class MessageHandler {
  private readonly logger = new Logger(MessageHandler.name);

  constructor(
    private readonly textHandlerRegistry: TextHandlerRegistryService,
    private readonly commandRegistry: CommandRegistryService,
    private readonly taskService: TaskService,
    private readonly rechargeHandler: RechargeHandler,
    private readonly durationLeaseHandler: DurationLeaseHandler,
    private readonly smartCustodyHandler: SmartCustodyHandler
  ) {}

  /**
   * 处理文本消息
   */
  async handle(bot: TelegramBot, msg: Message, user: User): Promise<void> {
    if (!msg.text || msg.text.startsWith("/")) {
      return; // 忽略命令
    }

    const chatId = msg.chat.id;
    const text = msg.text;
    this.logger.debug(`收到消息 from ${chatId}: ${text}`);

    try {
      // 如果有激活的任务，先检查输入是否是菜单文本
      if (this.taskService.hasTask(chatId)) {
        const task = this.taskService.getTask(chatId);
        const menuHandler = this.textHandlerRegistry.findHandler(text);

        // 如果是菜单文本，关闭任务并执行对应的处理器
        if (menuHandler && menuHandler.name !== "地址输入") {
          this.logger.debug(
            `任务激活状态下收到菜单文本，关闭任务并执行: ${menuHandler.name}`,
          );
          this.taskService.clearTask(chatId);
          await menuHandler.execute(bot, msg, user);
          return;
        }

        // 绑定/更换钱包地址的任务，直接让地址输入处理器处理（无论格式是否正确）
        if (task?.name === TaskNameConstants.TASK_BIND_ADDRESS) {
          const addressHandler = this.textHandlerRegistry
            .getAllHandlers()
            .find((h) => h.name === "地址输入");
          if (addressHandler) {
            this.logger.debug("任务激活状态下，让地址输入处理器处理");
            await addressHandler.execute(bot, msg, user);
            return;
          }
        }

        // 自定义充值任务
        if (task?.name === TaskNameConstants.TASK_CUSTOM_RECHARGE) {
          this.logger.debug("任务激活状态下，让自定义充值处理器处理");
          const telegramId = msg.from?.id?.toString() || "";
          await this.rechargeHandler.handleCustomRecharge(
            bot,
            chatId,
            telegramId,
            text,
            task.data?.currency,
          );
          return;
        }
        // 其他能量地址任务
        if (task?.name === TaskNameConstants.TASK_FOR_OTHER_ENERGY) {
          this.logger.debug("任务激活状态下，让其他能量地址处理器处理");
          await this.durationLeaseHandler.handleOtherAddress(bot, msg);
          return;
        }
        // 智能托管任务
        // if (task?.name === TaskNameConstants.TASK_FOR_OTHER_ENERGY) {
        //   this.logger.debug("任务激活状态下，让智能托管处理器处理");
        //   await this.smartCustodyHandler.execute(bot, msg, user);
        //   return;
        // }
        // 自动订单任务
        if (task?.name === TaskNameConstants.TASK_FOR_AUTO_ORDER) {
          this.logger.debug("任务激活状态下，让自动订单处理器处理");
          await this.rechargeHandler.handleAutoOrder(bot, msg);
          return;
        }
        return;
      }

      // 查找对应的文本处理器
      const handler = this.textHandlerRegistry.findHandler(text);

      if (handler) {
        // this.logger.debug(`找到文本处理器: ${handler.name}`);
        await handler.execute(bot, msg, user);
        return;
      }

      // 如果没有找到处理器，回退到 /start 命令
      const startHandler =
        this.commandRegistry.getCommand("start") ||
        this.commandRegistry.getCommand("/start");
      if (startHandler) {
        await startHandler.handle(bot, msg, user);
        return;
      }
      // 如果未注册 /start，发送默认提示
      await bot.sendMessage(chatId, "请使用 /start 开始使用机器人。");
    } catch (error) {
      this.logger.error(
        `处理文本消息失败 (chatId: ${chatId}, text: ${text}):`,
        error
      );
      try {
        await bot.sendMessage(chatId, "处理您的消息时发生错误，请稍后重试。");
      } catch (sendError) {
        this.logger.error("发送错误消息失败:", sendError);
      }
    }
  }


  
}
