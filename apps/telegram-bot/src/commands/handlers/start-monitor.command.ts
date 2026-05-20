import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import TelegramBot from "node-telegram-bot-api";
import { Message } from "node-telegram-bot-api";
import { ICommandHandler } from "../interfaces/command-handler.interface";
import { MonitorService } from "../../services/monitor.service";

/**
 * 开启监控命令处理器
 */
@Injectable()
export class StartMonitorCommand implements ICommandHandler {
  readonly command = "startbot";
  readonly description = "开启区块监控";
  readonly pattern = /^\/startbot(?:\s|$)/;

  private readonly logger = new Logger(StartMonitorCommand.name);

  constructor(
    private readonly monitorService: MonitorService,
    private readonly configService: ConfigService
  ) {}

  handle(bot: TelegramBot, msg: Message): void {
    const chatId = msg.chat.id;
    
    // 开启监控
    this.monitorService.enableMonitoring();
    
    // 获取本地节点配置
    const solidNodesStr = this.configService.get<string>('TRON_SOLID_NODES') || 
      'http://66.29.147.102:43921,http://45.137.213.34:43921';
    const solidNodes = solidNodesStr.split(',').map(url => url.trim()).filter(url => url.length > 0);
    const nodesList = solidNodes.map((node, index) => `${index + 1}. ${node}`).join('\n');
    
    const message = `✅ 区块监控已开启\n\n` +
      `系统将开始监控节点状态和区块高度差异。\n\n` +
      `<b>监控的本地节点：</b>\n${nodesList}\n\n` +
      `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

    bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
    });

    this.logger.log(`用户 ${msg.from?.id} 开启了区块监控`);
  }
}
