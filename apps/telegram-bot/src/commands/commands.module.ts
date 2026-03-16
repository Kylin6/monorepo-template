import { Module } from "@nestjs/common";
import { StartCommand } from "./handlers/start.command";
import { MeCommand } from "./handlers/me.command";
import { CommandRegistryService } from "./command-registry.service";
import { CommandsService } from "./commands.service";
import { ServicesModule } from "../services/services.module";

/**
 * 命令模块
 * 统一管理所有命令处理器
 */
@Module({
  imports: [
    ServicesModule, // 导入 ServicesModule 以获取 UserService
  ],
  providers: [
    StartCommand,
    MeCommand,
    CommandRegistryService,
    CommandsService,
  ],
  exports: [
    CommandsService, // 导出 CommandsService 供 TelegramBotService 使用
    CommandRegistryService, // 供 HandlersModule 注入
  ],
})
export class CommandsModule {}
