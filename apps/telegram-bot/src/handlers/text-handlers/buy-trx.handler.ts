import { Injectable, Logger } from "@nestjs/common";
import TelegramBot = require("node-telegram-bot-api");
import { Message } from "node-telegram-bot-api";
import { User } from "@database/index";
import { ITextHandler } from "../interfaces/text-handler.interface";
import { MenuTextConstants } from "../../common/constants/menu-text.constants";
import { SysCfgService } from "../../services/syscfg.service";
// import { AgentService } from "../../services/agent.service";
// import { PermissionUtil } from "../../utils/permission.util";
// import moment from "moment";

@Injectable()
export class BuyTrxHandler implements ITextHandler {
  readonly name = "购买 TRX";
  readonly text = MenuTextConstants.BUY_TRX;

  private readonly logger = new Logger(BuyTrxHandler.name);

  constructor(
    private readonly sysCfgService: SysCfgService,
    // private readonly agentService: AgentService
  ) {}

  async execute(
    bot: TelegramBot,
    msg: Message, 
    user: User
  ): Promise<void> {
    const chatId = msg.chat.id;

    // 权限检查 - 购买TRX 权限码 40
    // if (
    //   !agentInfo?.activePermissions ||
    //   !PermissionUtil.hasPermission(
    //     agentInfo.activePermissions,
    //     PermissionUtil.PERMISSION_CODES.BUY_TRX
    //   )
    // ) {
    //   await bot.sendMessage(chatId, "❌ 您没有使用此功能的权限。");
    //   return;
    // }

    const sysCfgValues = await this.sysCfgService.getSysCfgValues();
    const baseExchange = Number(sysCfgValues.rate);
    const u2tAddr = sysCfgValues.u2tRechargeAddr;
    const u2tText =
      `👍️️️️️️<b>全网最佳汇率，欢迎挑战！</b>\n\n` +
      `往🔻下方地址转U，6秒内自动回转TRX\n\n` +
      `<code>${u2tAddr}</code>\n` +
      `(点击地址自动复制)\n\n` +
      `<b>1USDT = ${Number(baseExchange).toFixed(2)} TRX</b>\n` +
      // `<b>汇率更新时间${moment(new Date()).format("MM-DD HH:mm")}</b>\n\n` +
      // `📣转U即返TRX，全自动兑换TRX\n` +
      // "❗️ <b>1U起换，上不封顶</b>\n\n" +
      "<b>⚠️默认回TRX到付款原地址❗️</b>\n" +
      "<b>回其他地址或大额兑换请联系客服❗️</b>\n";

    await bot.sendMessage(chatId, u2tText, {
      parse_mode: "HTML",
    });
  }
}
