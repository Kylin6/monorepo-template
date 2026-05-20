import { Injectable, Logger } from "@nestjs/common";
import TelegramBot from "node-telegram-bot-api";
import { Message } from "node-telegram-bot-api";
import { ICommandHandler } from "../interfaces/command-handler.interface";
import { MonitorService } from "../../services/monitor.service";

/**
 * 关闭监控命令处理器
 */
@Injectable()
export class StopMonitorCommand implements ICommandHandler {
  readonly command = "stopbot";
  readonly description = "关闭区块监控";
  readonly pattern = /^\/stopbot(?:\s|$)/;

  private readonly logger = new Logger(StopMonitorCommand.name);

  constructor(private readonly monitorService: MonitorService) {}

  handle(bot: TelegramBot, msg: Message): void {
    const chatId = msg.chat.id;
    
    // 关闭监控
    this.monitorService.disableMonitoring();
    
    const message = `⏸️ 区块监控已关闭\n\n` +
      `系统将停止监控节点状态和区块高度差异。\n` +
      `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

    bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
    });

    this.logger.log(`用户 ${msg.from?.id} 关闭了区块监控`);
  }
}
