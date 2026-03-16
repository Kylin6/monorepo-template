import { Injectable, Logger } from "@nestjs/common";
import { ITextHandler } from "./interfaces/text-handler.interface";
import { PersonalCenterHandler } from "./text-handlers/personal-center.handler";
import { ShortcutsHandler } from "./text-handlers/shortcuts.handler";
import { AddressInputHandler } from "./text-handlers/address-input.handler";
import { DurationLeaseHandler } from "./text-handlers/duration-lease.handler";
import { BuyTrxHandler } from "./text-handlers/buy-trx.handler";
import { SmartCustodyHandler } from "./text-handlers/smart-custody.handler";
/**
 * 文本处理器注册服务
 * 负责管理和注册所有文本消息处理器
 */
@Injectable()
export class TextHandlerRegistryService {
  private readonly logger = new Logger(TextHandlerRegistryService.name);
  private readonly handlers: Map<string, ITextHandler> = new Map();
  private readonly patternHandlers: ITextHandler[] = [];

  constructor(
    private readonly personalCenterHandler: PersonalCenterHandler,
    private readonly shortcutsHandler: ShortcutsHandler,
    private readonly addressInputHandler: AddressInputHandler,
    private readonly durationLeaseHandler: DurationLeaseHandler,
    private readonly buyTrxHandler: BuyTrxHandler,
    private readonly smartCustodyHandler: SmartCustodyHandler,
  ) {
    // 注册所有文本处理器
    this.registerHandler(this.personalCenterHandler);
    this.registerHandler(this.shortcutsHandler);
    this.registerHandler(this.addressInputHandler);
    this.registerHandler(this.durationLeaseHandler);
    this.registerHandler(this.buyTrxHandler);
    this.registerHandler(this.smartCustodyHandler);
  }

  /**
   * 注册文本处理器
   */
  private registerHandler(handler: ITextHandler): void {
    if (handler.pattern) {
      // 使用正则表达式匹配的处理器
      this.patternHandlers.push(handler);
      this.logger.debug(`注册文本处理器 (模式匹配): ${handler.name}`);
    }

    if (handler.text) {
      // 同时支持精确文本匹配
      this.handlers.set(handler.text, handler);
      this.logger.debug(
        `注册文本处理器 (文本匹配): ${handler.name} -> ${handler.text}`,
      );
    }

    if (!handler.text && !handler.pattern) {
      this.logger.warn(
        `文本处理器 ${handler.name} 没有提供 text 或 pattern，跳过注册`,
      );
    }
  }

  /**
   * 根据文本内容查找对应的处理器
   */
  findHandler(text: string): ITextHandler | null {
    // 1. 先尝试精确文本匹配（优先，因为更具体）
    const exactMatch = this.handlers.get(text);
    if (exactMatch) {
      return exactMatch;
    }

    // 2. 再尝试正则表达式匹配（用于通用规则，如地址格式）
    for (const handler of this.patternHandlers) {
      if (handler.pattern && handler.pattern.test(text)) {
        return handler;
      }
    }

    return null;
  }

  /**
   * 获取所有已注册的处理器
   */
  getAllHandlers(): ITextHandler[] {
    return [...Array.from(this.handlers.values()), ...this.patternHandlers];
  }
}
