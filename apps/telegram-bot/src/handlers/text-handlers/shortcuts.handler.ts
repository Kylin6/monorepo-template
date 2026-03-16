import { Injectable } from "@nestjs/common";
import TelegramBot from "node-telegram-bot-api";
import { ITextHandler } from "../interfaces/text-handler.interface";
import { MenuTextConstants } from "../../common/constants/menu-text.constants";
import { User } from "@database/index";
import { UserService } from "../../services/user.service";
import { SysCfgService } from "../../services/syscfg.service";
import { OrderService } from "../../services/order.service";
import { BusinessException } from "../../common/exceptions/business.exception";
import { LEASE_RECORDS_SOURCE } from "@database/constants/lease-records";

/**
 * 快捷指令处理器
 */
@Injectable()
export class ShortcutsHandler implements ITextHandler {
  readonly name = "快捷指令";
  readonly text = MenuTextConstants.SHORTCUTS;
  readonly pattern = /^([1])\1$/; // 支持 11 指令

  constructor(
    private readonly userService: UserService,
    private readonly sysCfgService: SysCfgService,
    private readonly orderService: OrderService
  ) {}

  /**
   * 处理快捷指令消息
   */

  async execute(
    bot: TelegramBot,
    msg: TelegramBot.Message,
    user: User
  ): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";
    // 如果是 11 指令，直接返回正在充值提示
    const match = text.match(this.pattern);
    if (match) {
      const count = Number(match[1]);
      await this.handleShortcutOrder(bot, chatId, count);
      return;
    }

    // 展示单笔指令能量价格：单价 * noUEnergyAmount / 1_000_000（TRX），取不到则显示 --
    let energyPriceLine = "单笔指令能量价格：--\n";
    let shortcutsPrice = 0;
    try {
      // const price = await this.orderService.getEnergyUnitPriceForShortcut(
      //   Number(user.id),
      //   1,
      //   "H"
      // );
      const sysCfgValues = await this.sysCfgService.getSysCfgValues();
      shortcutsPrice = Number(sysCfgValues.shortcutsPrice ?? 0);

      if (Number.isFinite(shortcutsPrice) && shortcutsPrice > 0) {
        energyPriceLine = `单笔指令能量价格：${shortcutsPrice} TRX\n`;
      }
    } catch {
      // ignore
    }

    const shortcutsText =
      `🕹 <b>快捷指令</b>\n` +
      // `➖➖➖➖➖➖➖➖➖➖\n\n` +
      `<b>💵当前每笔指令能量价格 = ${shortcutsPrice} TRX</b> \n\n` +
      `发送指令: 11 获取 <b>一笔</b> 真实笔数能量（不管对方有没U，一笔搞定）\n\n` +
      `常用地址：${user?.walletAddr || "未设置"}\n` +
      // `${energyPriceLine}` +
      `<b>⚠️对方地址无U 扣 ${shortcutsPrice} TRX,对方有U 返还 ${ Number(shortcutsPrice) / 2} TRX</b>\n` +
      // `⚠️对方地址无 U 需要两笔能量！\n\n` +
      `<b>⏰指令模式能量一小时有效！</b>\n` +
      `<b>⚠️此模式无需确认，收到命令能量秒到！小心使用哦！</b>\n`;

    const shortcutsKeyboard = {
      inline_keyboard: [
        [{ text: "绑定/更新地址", callback_data: "updatemyaddr:0" }],
      ],
    };

    await bot.sendMessage(chatId, shortcutsText, {
      parse_mode: "HTML",
      reply_markup: shortcutsKeyboard,
    });
  }

  async handleShortcutOrder(
    bot: TelegramBot,
    chatId: number,
    count: number
  ): Promise<void> {
    // 获取当前用户的常用地址
    const user = await this.userService.findByTelegramId(chatId.toString());
    if (!user) {
      await bot.sendMessage(
        chatId,
        "❌ 未找到您的用户信息，请先使用 /start 初始化。"
      );
      return;
    }
    const toAddr = user.walletAddr;
    if (!toAddr) {
      await bot.sendMessage(
        chatId,
        "❌ 未找到您的常用地址，请先设置常用地址。"
      );
      return;
    }

    const sysCfgValues = await this.sysCfgService.getSysCfgValues();
    const energyPerCount = Number(sysCfgValues.countAmount ?? 0);
    if (!Number.isFinite(energyPerCount) || energyPerCount <= 0) {
      await bot.sendMessage(
        chatId,
        "❌ 系统未配置单笔能量数量(singleAmount)，请联系管理员。"
      );
      return;
    }
    const amount = count * energyPerCount;

    // console.log( user.id,toAddr, amount, LEASE_RECORDS_SOURCE.SHORTCUTS);
    try {
      const { orders } = await this.orderService.createShortcutsOrder(
        user.id,
        toAddr
      );
      const orderIds = orders.map((o) => o.id).join(", ");
      const text =
        `指令 ${count}${count}\n` +
        `➖➖➖➖➖➖➖➖➖➖\n\n` +
        `地址：${toAddr}\n` +
        `能量数量：${amount}\n` +
        `有效期：1小时\n\n` +
        `✅ 订单已提交，正在处理…\n` +
        (orderIds ? `订单号：${orderIds}\n` : "");
      await bot.sendMessage(chatId, text);
    } catch (e: unknown) {
      const message =
        e instanceof BusinessException
          ? e.message
          : e instanceof Error
          ? e.message
          : "创建订单失败，请稍后重试";
      await bot.sendMessage(chatId, `❌ ${message}`);
    }
  }
}
