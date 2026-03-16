import { Module } from "@nestjs/common";
import { MessageHandler } from "./message.handler";
import { CallbackHandler } from "./callback.handler";
import { TextHandlerRegistryService } from "./text-handler-registry.service";
import { PersonalCenterHandler } from "./text-handlers/personal-center.handler";
import { ShortcutsHandler } from "./text-handlers/shortcuts.handler";
import { AddressInputHandler } from "./text-handlers/address-input.handler";
import { CommandsModule } from "../commands/commands.module";
import { ServicesModule } from "../services/services.module";
import { RechargeHandler } from "./text-handlers/recharge.handler";
import { DurationLeaseHandler } from "./text-handlers/duration-lease.handler";
import { BuyTrxHandler } from "./text-handlers/buy-trx.handler";
import { SmartCustodyHandler } from "./text-handlers/smart-custody.handler";

/**
 * Handlers 模块
 * 统一管理所有消息和事件处理器
 */
@Module({
  imports: [
    CommandsModule, // 提供 CommandRegistryService
    ServicesModule, // 提供 TaskService、UserService
  ],
  providers: [
    MessageHandler,
    CallbackHandler,
    TextHandlerRegistryService,
    PersonalCenterHandler,
    ShortcutsHandler,
    AddressInputHandler,
    RechargeHandler,
    DurationLeaseHandler,
    BuyTrxHandler,
    SmartCustodyHandler,
  ],
  exports: [MessageHandler, CallbackHandler, TextHandlerRegistryService],
})
export class HandlersModule {}
