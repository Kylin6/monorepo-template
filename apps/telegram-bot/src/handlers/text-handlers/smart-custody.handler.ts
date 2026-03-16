import { Injectable, Logger } from "@nestjs/common";
import TelegramBot, { Message } from "node-telegram-bot-api";
import { User } from "@database/index";
import { ITextHandler } from "../interfaces/text-handler.interface";
import { MenuTextConstants } from "../../common/constants/menu-text.constants";
import { SysCfgService } from "../../services/syscfg.service";
import { UserService } from "../../services/user.service";

@Injectable()
export class SmartCustodyHandler implements ITextHandler {
  readonly name = "智能托管";
  readonly text = MenuTextConstants.SMART_CUSTODY;

  private readonly logger = new Logger(SmartCustodyHandler.name);

  constructor(
    private readonly sysCfgService: SysCfgService,
    private readonly userService: UserService,
  ) {}

  async execute(
    bot: TelegramBot,
    msg: Message,
    userFromContext: User,
  ): Promise<void> {
    const chatId = msg.chat.id;

    this.logger.debug(`处理智能托管 (chatId: ${chatId})`);

    const telegramId = msg.from?.id?.toString();
    if (!telegramId) {
      await bot.sendMessage(chatId, "❌ 无法获取您的账号信息，请稍后再试。");
      return;
    }

    const sysCfgValues = await this.sysCfgService.getSysCfgValues();
    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      await bot.sendMessage(
        chatId,
        "❌ 未找到您的用户信息，请先使用 /start 初始化。",
      );
      return;
    }

    const singleAmount = sysCfgValues.singleAmount ?? 0;
    const countAmount = sysCfgValues.countAmount ?? singleAmount * 2;
    const autoLeasePrice = sysCfgValues.autoLeasePrice ?? 0;
    const countBandwidthPrice = sysCfgValues.countBandwidthPrice ?? 0;
    // 获取用户托管浮动价
    const userFloatSun = user.planEnergyPriceFloat ?? 0;
    const finalPriceSun = Number(autoLeasePrice) + Number(userFloatSun);
    // 这里使用基础单价估算每笔 TRX 费用，避免依赖 agent 模块
    const singleAmountSun =
      Math.ceil(((singleAmount * finalPriceSun) / 1_000_000) * 100) / 100;
    const countAmountSun =
      Math.ceil(((countAmount * finalPriceSun) / 1_000_000) * 100) / 100;

    const text =
      `<b>🤖 智能托管</b>\n` +
      `➖➖➖➖➖➖➖➖➖➖\n\n` +
      `<b>费用说明</b>\n` +
      `💰1笔(${singleAmount.toLocaleString()}能量) ≈ ${singleAmountSun.toFixed(
        2,
      )} TRX\n` +
      `💰2笔(${countAmount.toLocaleString()}能量) ≈ ${countAmountSun.toFixed(
        2,
      )} TRX\n` +
      `💰包带宽费用 ≈ ${countBandwidthPrice.toFixed(
        2,
      )} TRX\n\n` +
      "<b>使用流程</b>\n" +
      "1、保证余额充足。\n" +
      "2、点击【新增地址】选择托管的能量数量。\n" +
      `3、输入正确的能量接收地址进行开通。\n\n` +
      `<b>温馨提示：</b>\n` +
      `-您的托管地址始终保持${singleAmount.toLocaleString()}/${countAmount.toLocaleString()}能量，低于即补\n` +
      `-托管地址每USDT转账一次计一笔费用，账户余额扣费\n` +
      `-对方没U或向交易所转账,请选择${countAmount.toLocaleString()}能量\n` +
      "-24小时内未转账，会扣除一笔计数\n" +
      "-可随开随关地址托管，关闭后不再扣费\n" +
      "-建议一天最少转账超过一次使用\n\n" +
      `<b>💰账户余额：</b>${user?.balance} TRX\n` +
      `${user?.balance && Number(user?.balance) <= 0 ? "<code>余额不足,请先充值</code>" : ""}\n`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "💰 余额充值", callback_data: "rechargemenu:trx" },
          { text: "📋 托管列表", callback_data: "smart_lease_list" },
        ],
        [
          {
            text: "🆕 新增地址",
            callback_data: `smart_lease_add:0`,
          },
        ],
      ],
    };
    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }
}
