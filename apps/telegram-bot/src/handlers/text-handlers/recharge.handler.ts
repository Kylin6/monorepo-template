import { Injectable, Logger } from "@nestjs/common";
import TelegramBot = require("node-telegram-bot-api");
import { Message } from "node-telegram-bot-api";
import { User } from "@database/index";
import { ITextHandler } from "../interfaces/text-handler.interface";
import { TaskService } from "../../services/task.service";
import { TaskNameConstants } from "../../common/constants/menu-text.constants";
import { SysCfgService } from "../../services/syscfg.service";
// import { AgentService } from "../../services/agent.serice";
import { RechargeService } from "../../services/recharge.service";
import { UserService } from "../../services/user.service";
import { TronService } from "../../services/tron.service";
import { OrderService } from "../../services/order.service";
import { isValidTronAddress } from "../../utils/helpers.util";
import { ErrorHandlerUtil } from "../../utils/error-handler.util";

// 充值配置接口
interface RechargeOption {
  amount: number;
  currency: "TRX" | "USDT";
  displayText: string;
}

// 充值配置数组
const RECHARGE_OPTIONS: RechargeOption[] = [
  // TRX 充值选项
  { amount: 100, currency: "TRX", displayText: "100 TRX" },
  { amount: 200, currency: "TRX", displayText: "200 TRX" },
  { amount: 500, currency: "TRX", displayText: "500 TRX" },
  { amount: 1000, currency: "TRX", displayText: "1000 TRX" },
  { amount: 2000, currency: "TRX", displayText: "2000 TRX" },
  { amount: 5000, currency: "TRX", displayText: "5000 TRX" },

  // // USDT 充值选项
  // { amount: 30, currency: "USDT", displayText: "30 U" },
  // { amount: 50, currency: "USDT", displayText: "50 U" },
  // { amount: 100, currency: "USDT", displayText: "100 U" },
  // { amount: 200, currency: "USDT", displayText: "200 U" },
  // { amount: 500, currency: "USDT", displayText: "500 U" },
  // { amount: 1000, currency: "USDT", displayText: "1000 U" },
];

@Injectable()
export class RechargeHandler implements ITextHandler {
  readonly name = "余额充值";
  readonly text = "充值";

  private readonly logger = new Logger(RechargeHandler.name);

  constructor(
    private readonly state: TaskService,
    private readonly sysCfgService: SysCfgService,
    private readonly rechargeService: RechargeService,
    private readonly userService: UserService,
    private readonly tronService: TronService,
    private readonly orderService: OrderService
  ) {}

  async execute(
    bot: TelegramBot,
    msg: TelegramBot.Message,
    user: User,
  ): Promise<void> {
    const chatId = msg.chat.id;
    try {
      // 生成充值界面
      await this.showRechargeMenu(bot, chatId, user);
    } catch (error) {
      console.error("RechargeCommand执行错误:", error);
      await bot.sendMessage(
        chatId,
        "抱歉，加载充值界面时出现错误，请稍后重试。",
      );
    }
  }

  // 显示充值菜单
  private async showRechargeMenu(
    bot: TelegramBot,
    chatId: number,
    user: User,
  ): Promise<void> {
    const titleText = "请选择您要充值的金额：";
    // "➖➖➖➖➖➖➖➖➖➖\n" +
    // "⚠️温馨提示⚠️\n" +
    // "选择USDT充值将自动兑换成TRX\n" +
    // `<b>1USDT = xxxxx TRX</b>\n`;

    // 按货币类型分组
    const trxOptions = RECHARGE_OPTIONS.filter(
      (option) => option.currency === "TRX",
    );
    const usdtOptions = RECHARGE_OPTIONS.filter(
      (option) => option.currency === "USDT",
    );

    // 生成键盘布局
    const keyboard = this.generateRechargeKeyboard(trxOptions, usdtOptions);

    await bot.sendMessage(chatId, titleText, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }

  // 生成充值键盘
  private generateRechargeKeyboard(
    trxOptions: RechargeOption[],
    usdtOptions: RechargeOption[],
  ): any {
    const keyboard: any[] = [];

    // TRX 充值选项 (每行3个)
    for (let i = 0; i < trxOptions.length; i += 3) {
      const row = trxOptions.slice(i, i + 3).map((option) => ({
        text: option.displayText,
        callback_data: `recharge:${option.currency}:${option.amount}`,
      }));
      keyboard.push(row);
    }

    // TRX 自定义充值按钮
    keyboard.push([
      {
        text: "💰 💰 自定义充值TRX金额",
        callback_data: "recharge:TRX:custom",
      },
    ]);

    // // USDT 充值选项 (每行3个)
    // for (let i = 0; i < usdtOptions.length; i += 3) {
    //   const row = usdtOptions.slice(i, i + 3).map((option) => ({
    //     text: option.displayText,
    //     callback_data: `recharge:${option.currency}:${option.amount}`,
    //   }));
    //   keyboard.push(row);
    // }

    // // USDT 自定义充值按钮
    // keyboard.push([
    //   {
    //     text: "💰 💰 自定义充值USDT金额",
    //     callback_data: "recharge:USDT:custom",
    //   },
    // ]);

    // 返回按钮
    keyboard.push([
      {
        text: "❌ 取消",
        callback_data: "delete_message",
      },
    ]);

    return {
      inline_keyboard: keyboard,
    };
  }

  // 处理充值选择
  async handleRechargeSelection(
    bot: TelegramBot,
    query: any,
    user: User,
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const from = query.from;
    const data = query.data;

    if (!chatId || !from || !data) return;

    await bot.answerCallbackQuery(query.id, {
      text: "正在处理充值请求...",
    });

    const [, currency, amount] = data.split(":");

    if (amount === "custom") {
      // 处理自定义充值
      // 开启"等待输入地址"的任务状态
      this.state.setTask(chatId, TaskNameConstants.TASK_CUSTOM_RECHARGE, {
        currency,
      });
      await bot.sendMessage(
        chatId,
        `💰 <b>自定义充值</b>\n` + `请输入您要充值的${currency}金额：\n`,
        {
          parse_mode: "HTML",
        },
      );
    } else {
      // 处理固定金额充值
      const rechargeAmount = parseInt(amount);

      try {
        const user = await this.userService.findByTelegramId(
          from.id?.toString() ?? "",
        );
        if (!user) {
          await bot.sendMessage(
            chatId,
            "❌ 未找到您的用户信息，请先使用 /start 初始化。",
          );
          return;
        }

        const apply = await this.rechargeService.createRechargeApply(
          user.id,
          rechargeAmount.toString(),
          currency,
        );

        const now = Math.floor(Date.now() / 1000);
        const safeExpireAt = apply.expireAt ?? now;
        const remainSeconds = Math.max(0, safeExpireAt - now);
        const remainMinutes = Math.max(1, Math.ceil(remainSeconds / 60));
        const expireTime = this.formatUnixTime(safeExpireAt);

        const message =
          `你正在进行充值....\n\n` +
          `订单编号: <code>${apply.id}</code>\n` +
          `支付币种: <b>${apply.currency}</b>\n` +
          `转账地址:\n` +
          `<code>${apply?.toAddr || ""}</code>\n\n` +
          `转账金额: <b><code>${apply.amount}</code> ${apply.currency}</b>\n` +
          `📣 <b>注意小数点!</b>\n` +
          `📣 <b>注意小数点!</b>\n\n` +
          `请一定要按照以上金额进行转账充值,否则无法自动到账! \n在 <b>${remainMinutes} 分钟内</b>完成转账（截止 ${expireTime}）。`;

        await bot.sendMessage(chatId, message, {
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error("充值处理失败:", error);

        // const Keyboard = {
        //   inline_keyboard: [
        //     [
        //       { text: "重新绑定", callback_data: "updatemyaddr:0" },
        //     ],
        //   ],
        // };
        await bot.sendMessage(
          chatId,
          `❌ <b>充值处理失败</b>\n\n` + `系统错误，请稍后重试`,
          {
            parse_mode: "HTML",
            // reply_markup: Keyboard,
          },
        );
      }
    }
  }

  // 处理自定义充值
  async handleCustomRecharge(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    inputText: string,
    currency: string,
  ): Promise<void> {
    const rechargeAmount = Number(inputText);
    if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
      await bot.sendMessage(
        chatId,
        "❌ 金额格式不正确，请输入大于 0 的数字金额。",
      );
      return;
    }
    try {
      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          "❌ 未找到您的用户信息，请先使用 /start 初始化。",
        );
        return;
      }

      const apply = await this.rechargeService.createRechargeApply(
        user.id,
        rechargeAmount.toString(), // 原始金额，服务内会叠加随机尾数
        currency,
      );

      const now = Math.floor(Date.now() / 1000);
      const safeExpireAt = apply.expireAt ?? now;
      const remainSeconds = Math.max(0, safeExpireAt - now);
      const remainMinutes = Math.max(1, Math.ceil(remainSeconds / 60));
      const expireTime = this.formatUnixTime(safeExpireAt);

      const message =
        `你正在进行充值....\n\n` +
        `订单编号: <code>${apply.id}</code>\n` +
        `支付币种: <b>${apply.currency}</b>\n` +
        `转账地址:\n` +
        `<code>${apply?.toAddr || ""}</code>\n\n` +
        `转账金额: <b><code>${apply.amount}</code> ${apply.currency}</b>\n` +
        `📣 <b>注意小数点!</b>\n` +
        `📣 <b>注意小数点!</b>\n\n` +
        `请一定要按照以上金额进行转账充值,否则无法自动到账! \n在 <b>${remainMinutes} 分钟内</b>完成转账（截止 ${expireTime}）。`;

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
      });
      // 完成后清理任务
      this.state.clearTask(chatId);
    } catch (error) {
      console.error("充值处理失败:", error);

      // const Keyboard = {
      //   inline_keyboard: [
      //     [
      //       {
      //         text: "💁 联系客服",
      //         url: `https://t.me/trxenio`,
      //       },
      //     ],
      //   ],
      // };
      await bot.sendMessage(
        chatId,
        `❌ <b>充值处理失败</b>\n\n` + `系统错误，请稍后重试`,
        {
          parse_mode: "HTML",
          // reply_markup: Keyboard,
        },
      );
    }
  }

  private formatUnixTime(tsSec: number): string {
    const d = new Date(tsSec * 1000);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");
    return `${mm}-${dd} ${HH}:${MM}`;
  }

  // 处理智能托管订单下单
  async handleAutoOrder(
    bot: TelegramBot,
    msg: Message,
  ): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();
    const task = this.state.getTask(chatId);
    const telegramId = msg.from?.id?.toString() || "";
    if (
      !this.state.hasTask(chatId) ||
      task?.name !== TaskNameConstants.TASK_FOR_AUTO_ORDER
    ) {
      return;
    }
    this.logger.debug(
      `处理自动订单 (chatId: ${chatId}, text: ${text})`,
    );
    if (!text) {
      await bot.sendMessage(chatId, "❌ 请输入有效的能量接收地址。");
      return;
    }
    const address = text;
    if (!isValidTronAddress(address)) {
      await bot.sendMessage(chatId, "❌ 能量接收地址格式不正确。");
      return;
    }
    const validation = await this.tronService.validateAddress(address);
    if (!validation.valid) {
      await bot.sendMessage(
        chatId,
        `❌ 能量接收地址无效: ${validation.message || "地址验证失败"}`,
      );
      return;
    }
    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      await bot.sendMessage(
        chatId,
        "❌ 未找到您的用户信息，请先使用 /start 初始化。",
      );
      return;
    }
    const taskData = task.data;
    if (!taskData) {
      await bot.sendMessage(chatId, "❌ 任务数据丢失，请重新选择。");
      this.state.clearTask(chatId);
      return;
    }
    const withBandwidth = Number(taskData.withBandwidth) || 0;
    const limit = Number(taskData.energyAmount) || 0;

    try {
      await this.orderService.createSmartLeaseOrder(
        user.id,
        address,
        withBandwidth,
        limit,
      );
      const bandwidthText = withBandwidth === 10 ? "包含带宽" : "不包含带宽";
      const successText =
        "🎉 <b>智能托管创建成功！</b>\n\n" +
        `能量数量: ${limit.toLocaleString()} 能量 (${bandwidthText})\n` +
        `接收地址: <code>${address}</code>\n`;
      await bot.sendMessage(chatId, successText, {
        parse_mode: "HTML",
      });
      this.state.clearTask(chatId);
    } catch (error) {
      this.state.clearTask(chatId);
      await ErrorHandlerUtil.handleError(bot, chatId, error, {
        logger: this.logger,
      });
    }
  }
}
