import { Injectable, Logger } from "@nestjs/common";
import TelegramBot, { CallbackQuery, Message } from "node-telegram-bot-api";
import { User, type ResourcePrice, ResourcePriceModel } from "@database/index";
import { UserService } from "../../services/user.service";
import { TaskService } from "../../services/task.service";
import { SysCfgService } from "../../services/syscfg.service";
import { OrderService } from "../../services/order.service";
import { RechargeService } from "../../services/recharge.service";
import { TronService } from "../../services/tron.service";
import { createMainMenuKeyboard } from "../../utils/keyboard.util";
import { ITextHandler } from "../interfaces/text-handler.interface";
import {
  MenuTextConstants,
  TaskNameConstants,
} from "../../common/constants/menu-text.constants";
import { isValidTronAddress, formatTime } from "../../utils/helpers.util";
import { ErrorHandlerUtil } from "../../utils/error-handler.util";

/**
 * 能量闪租处理器
 */
@Injectable()
export class DurationLeaseHandler implements ITextHandler {
  readonly name = "DurationLeaseHandler";
  readonly text = MenuTextConstants.DURATION_LEASE;

  private readonly logger = new Logger(this.name);
  // 默认值
  private readonly DEFAULT_ENERGY_PER_COUNT = 65000; // 每笔能量数量
  private readonly DEFAULT_COUNT = 1; // 默认笔数
  private readonly DEFAULT_DURATION_EXPIRE = 1; // 默认时长
  private readonly DEFAULT_DURATION_TYPE = "H"; // 默认类型：小时
  private readonly COUNT_OPTIONS = [3, 4, 5, 10, 20, 1, 2];

  constructor(
    private readonly userService: UserService,
    private readonly state: TaskService,
    private readonly sysCfgService: SysCfgService,
    private readonly orderService: OrderService,
    private readonly rechargeService: RechargeService,
    private readonly tronService: TronService
  ) {}

  /**
   * 处理能量闪租消息
   */
  async execute(
    bot: TelegramBot,
    msg: TelegramBot.Message,
    user: User
  ): Promise<void> {
    const chatId = msg.chat.id;
    const mainMenuKeyboard = createMainMenuKeyboard();

    try {
      if (!user) {
        await bot.sendMessage(chatId, "未找到用户信息，请先使用 /start 命令", {
          reply_markup: mainMenuKeyboard,
        });
        return;
      }
      // 获取基础价格列表
      const priceList = await this.orderService.getDurationLeasePriceList();

      if (!priceList.length) {
        await bot.sendMessage(chatId, "❌ 暂无可用的租赁套餐，请稍后再试。");
        return;
      }

      // 根据用户价格浮动调整最终价格
      this.applyUserPriceFloat(priceList, user);
      const { text, keyboard } = this.buildMessageAndKeyboard(priceList);

      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } catch (error) {
      await bot.sendMessage(chatId, "获取用户信息失败，请稍后重试", {
        reply_markup: mainMenuKeyboard,
      });
    }
  }

  /**
   * 构建消息文本和键盘
   */
  buildMessageAndKeyboard(priceList: ResourcePrice[]): {
    text: string;
    keyboard: TelegramBot.InlineKeyboardMarkup;
  } {
    const text =
      `租用能量,转账无需 TRX 消耗, 0 手续费!!!\n` +
      `------------------------\n` +
      `发送 /start 获取菜单\n` +
      `提示:对未激活地址转账手续费需要双倍\n\n`;

    const keyboard = this.buildKeyboard(priceList);

    return { text, keyboard };
  }

  /**
   * 构建键盘按钮
   */
  private buildKeyboard(
    priceList: ResourcePrice[]
  ): TelegramBot.InlineKeyboardMarkup {
    const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

    // 将价格转换为统一的时间单位（分钟）进行排序
    const convertToMinutes = (price: ResourcePrice): number => {
      switch (price.expireType) {
        case "M":
          return price.expire;
        case "H":
          return price.expire * 60;
        case "D":
          return price.expire * 24 * 60;
        default:
          return 0;
      }
    };

    // 按时间从小到大排序
    const sortedPrices = [...priceList].sort((a, b) => {
      return convertToMinutes(a) - convertToMinutes(b);
    });

    if (!sortedPrices.length) {
      return { inline_keyboard: [] };
    }

    sortedPrices.forEach((price) => {
      const durationText = this.getDurationText(price.expire, price.expireType);
      keyboard.push([
        {
          text: `⏬ ${durationText}套餐可余额支付 ⏬`,
          callback_data: "duration_lease:noop",
        },
      ]);

      const rows: TelegramBot.InlineKeyboardButton[][] = [];
      let row: TelegramBot.InlineKeyboardButton[] = [];

      this.COUNT_OPTIONS.forEach((count) => {
        row.push({
          text: `${count}笔`,
          callback_data: `duration_lease:count:${price.expire}:${price.expireType}:${count}`,
        });

        if (row.length === 5) {
          rows.push(row);
          row = [];
        }
      });

      if (row.length) {
        rows.push(row);
      }

      keyboard.push(...rows);
    });

    return { inline_keyboard: keyboard };
  }

  /**
   * 根据用户的价格浮动调整套餐价格
   * 最终价格 = 基础价格 + user.energyPriceFloat
   */
  private applyUserPriceFloat(priceList: ResourcePrice[], user: User): void {
    priceList.forEach((p) => {
      const finalPrice = ResourcePriceModel.getFinalPriceForUser(p, user);
      p.price = finalPrice.toFixed(2);
    });
  }
  getDurationText(expire: number | string, expireType: string | null): string {
    const expireNum = typeof expire === "string" ? parseInt(expire) : expire;
    const typeMap: { [key: string]: string } = {
      M: "分钟",
      H: "小时",
      D: "天",
    };

    const unit = typeMap[(expireType ?? "H").toUpperCase()] || "小时";
    return `${expireNum}${unit}`;
  }

  /**
   * 获取视图（供回调处理器使用）
   */
  async getView(
    _telegramId: string,
    _selectedExpire: number,
    _selectedExpireType: "D" | "H" | "M",
    _selectedCount: number
  ): Promise<{ text: string; keyboard: TelegramBot.InlineKeyboardMarkup }> {
    const priceList = await this.orderService.getDurationLeasePriceList();
    return this.buildMessageAndKeyboard(priceList);
  }
  // 处理支付
  async handlePayOrder(
    bot: TelegramBot,
    query: CallbackQuery,
    telegramId: string
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;
    if (!chatId || !messageId || !data) {
      return;
    }
    try {
      const parts = data.split(":");
      const action = parts[1];
      if (action !== "pay") {
        return;
      }

      const expire = parseInt(parts[2], 10) || this.DEFAULT_DURATION_EXPIRE;
      const expireType =
        (parts[3]?.toUpperCase() as "D" | "H" | "M") ||
        this.DEFAULT_DURATION_TYPE;
      const count = parseInt(parts[4], 10) || this.DEFAULT_COUNT;

      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await bot.sendMessage(chatId, "❌ 未找到用户信息，请先 /start 初始化");
        return;
      }
      if (!user.walletAddr) {
        const keyboard = {
          inline_keyboard: [
            [{ text: "绑定地址", callback_data: "updatemyaddr:0" }],
          ],
        };
        await bot.sendMessage(chatId, "❌ 未绑定接收地址，请先绑定钱包地址", {
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
        return;
      }

      const sysCfgValues = await this.sysCfgService.getSysCfgValues();
      const energyPerCount = Number(
        sysCfgValues.singleAmount ?? this.DEFAULT_ENERGY_PER_COUNT
      );
      const amount = count * energyPerCount;

      const orderResult = await this.orderService.createDurationLeaseOrder(
        user.id,
        user.walletAddr,
        amount,
        expire,
        expireType,
        "E"
      );

      await bot.answerCallbackQuery(query.id, {
        text: "✅ 订单已提交，正在处理",
        show_alert: false,
      });
      await this.sendOrderSuccessMessage(
        bot,
        chatId,
        user,
        expire,
        expireType,
        count,
        energyPerCount,
        user.walletAddr,
        orderResult.orders?.[0]?.id
      );
    } catch (error) {
      await ErrorHandlerUtil.handleError(bot, chatId, error, {
        queryId: query.id,
        logger: this.logger,
        useAlert: true,
      });
    }
  }
  // 余额支付时长租赁订单
  async handleDurationLeaseBalancePay(
    bot: TelegramBot,
    query: CallbackQuery
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const data = query.data;

    if (!chatId || !data) {
      return;
    }

    try {
      const telegramId = query.from?.id?.toString() ?? "";
      const user = telegramId
        ? await this.userService.findByTelegramId(telegramId)
        : null;
      if (!user) {
        await bot.sendMessage(
          chatId,
          "❌ 未找到您的用户信息，请先使用 /start 初始化。"
        );
        return;
      }
      const orderKey = data.split(":")[1];
      if (!orderKey) {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ 无效的订单编号",
          show_alert: true,
        });
        return;
      }

      const pending = this.state.getAndClearPendingOrder(orderKey);
      if (!pending) {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ 订单已过期，请重新选择",
          show_alert: true,
        });
        return;
      }

      const { expire, expireType, count, totalEnergy, targetAddr } = pending;

      const result = await this.orderService.createDurationLeaseOrderByBalance(
        user.id,
        expire,
        expireType,
        count,
        totalEnergy,
        targetAddr
      );

      await bot.answerCallbackQuery(query.id, {
        text: "✅ 余额支付成功，正在发放能量",
        show_alert: false,
      });

      await this.sendOrderSuccessMessage(
        bot,
        chatId,
        user,
        result.expire,
        result.expireType,
        result.count,
        result.energyPerCount,
        result.toAddr,
        result.orderId
      );
    } catch (error) {
      await ErrorHandlerUtil.handleError(bot, chatId, error, {
        queryId: query.id,
        logger: this.logger,
        useAlert: true,
      });
    }
  }

  // // 余额支付时长租赁订单
  // async handleDurationLeaseBalancePay(
  //   bot: TelegramBot,
  //   query: CallbackQuery
  // ): Promise<void> {
  //   const chatId = query.message?.chat.id;
  //   const data = query.data;

  //   if (!chatId || !data) {
  //     return;
  //   }

  //   try {
  //     const telegramId = query.from?.id?.toString() ?? "";
  //     const user = telegramId
  //       ? await this.userService.findByTelegramId(telegramId)
  //       : null;
  //     if (!user) {
  //       await bot.sendMessage(
  //         chatId,
  //         "❌ 未找到您的用户信息，请先使用 /start 初始化。"
  //       );
  //       return;
  //     }
  //     const applyId = Number(data.split(":")[1]);
  //     if (!Number.isFinite(applyId) || applyId <= 0) {
  //       await bot.answerCallbackQuery(query.id, {
  //         text: "❌ 无效的订单编号",
  //         show_alert: true,
  //       });
  //       return;
  //     }
  //     console.log("applyId", applyId);

  //     const result = await this.orderService.createDurationLeaseOrderByBalance(
  //       applyId
  //     );

  //     await bot.answerCallbackQuery(query.id, {
  //       text: "✅ 余额支付成功，正在发放能量",
  //       show_alert: false,
  //     });

  //     await this.sendOrderSuccessMessage(
  //       bot,
  //       chatId,
  //       user,
  //       result.expire,
  //       result.expireType,
  //       result.count,
  //       result.energyPerCount,
  //       result.toAddr,
  //       result.orderId
  //     );
  //   } catch (error) {
  //     await ErrorHandlerUtil.handleError(bot, chatId, error, {
  //       queryId: query.id,
  //       logger: this.logger,
  //       useAlert: true,
  //     });
  //   }
  // }

  // 处理其他地址
  async handleOtherAddress(bot: TelegramBot, msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    this.logger.debug(`处理其他地址 (chatId: ${chatId})`);
    const text = msg.text?.trim();
    // 只有在任务状态为"等待笔数"时才处理；否则忽略让其他逻辑接管
    const task = this.state.getTask(chatId);
    if (
      !this.state.hasTask(chatId) ||
      task?.name !== TaskNameConstants.TASK_FOR_OTHER_ENERGY
    ) {
      return;
    }
    const toAddr = text;
    // 1. 验证地址格式
    if (!toAddr) {
      await bot.sendMessage(chatId, "❌ 请输入有效的能量接收地址。");
      return;
    }

    if (!isValidTronAddress(toAddr)) {
      await bot.sendMessage(chatId, "❌ 能量接收地址格式不正确。");
      return;
    }
    // 2. 验证 TRON 地址有效性
    try {
      const validation = await this.tronService.validateAddress(toAddr);
      if (!validation.valid) {
        await bot.sendMessage(
          chatId,
          `❌ 能量接收地址无效: ${validation.message || "地址验证失败"}`
        );
        return;
      }
    } catch (error) {
      this.logger.error(`验证钱包地址失败 (toAddr: ${toAddr}):`, error);
      await bot.sendMessage(chatId, "❌ 验证钱包地址时发生错误，请稍后重试。");
      return;
    }
    const telegramId = msg.from?.id?.toString();
    if (!telegramId) {
      await bot.sendMessage(chatId, "❌ 无法获取您的账号信息，请稍后再试。");
      return;
    }

    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      await bot.sendMessage(
        chatId,
        "❌ 未找到用户信息，请先使用 /start 初始化。"
      );
      return;
    }

    const count = task.data?.count ?? this.DEFAULT_COUNT;
    const totalEnergy =
      task.data?.amount ?? count * this.DEFAULT_ENERGY_PER_COUNT;
    const energyPerCount =
      count > 0
        ? Math.round(totalEnergy / count)
        : this.DEFAULT_ENERGY_PER_COUNT;
    const expire = task.data?.expire ?? this.DEFAULT_DURATION_EXPIRE;
    const expireType =
      (task.data?.expireType as "D" | "H" | "M") ?? this.DEFAULT_DURATION_TYPE;

    try {
      const priceList = await this.orderService.getDurationLeasePriceList();
      // 应用用户价格浮动
      this.applyUserPriceFloat(priceList, user);

      const priceInfo = priceList.find(
        (p) => p.expire === expire && p.expireType === expireType
      );

      if (!priceInfo) {
        await bot.sendMessage(chatId, "❌ 当前套餐暂不可用，请重新选择。");
        this.state.clearTask(chatId);
        return;
      }

      const pricePerCount = parseFloat(priceInfo.price);
      const rawAmount = (totalEnergy * pricePerCount) / 1000000;
      const baseAmount = Math.ceil(rawAmount * 100) / 100;

      if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
        await bot.sendMessage(chatId, "❌ 订单金额异常，请稍后再试。");
        this.state.clearTask(chatId);
        return;
      }

      // const apply = await this.rechargeService.createDurationLeaseApply(
      //   user.id,
      //   baseAmount.toFixed(4),
      //   "TRX",
      //   count,
      //   expire,
      //   expireType,
      //   toAddr,
      //   "E",
      //   {
      //     energyPerCount,
      //     totalEnergy,
      //     count,
      //     type: "E",
      //   }
      // );

      const orderKey = this.state.setPendingOrder({
        expire,
        expireType,
        count,
        totalEnergy,
        targetAddr: toAddr,
        energyPerCount,
      });

      const { text, keyboard } = this.buildDurationLeaseApplyMessage(
        count,
        energyPerCount,
        totalEnergy,
        expire,
        expireType,
        pricePerCount,
        toAddr,
        orderKey
      );

      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      this.state.clearTask(chatId);
    } catch (error) {
      await ErrorHandlerUtil.handleError(bot, chatId, error, {
        logger: this.logger,
      });
    }
  }

  private buildDurationLeaseApplyMessage(
    count: number,
    energyPerCount: number,
    totalEnergy: number,
    expire: number,
    expireType: "D" | "H" | "M",
    pricePerCount: number,
    targetAddr: string,
    orderKey: string
  ): {
    text: string;
    keyboard: TelegramBot.InlineKeyboardMarkup;
  } {
    const durationText = this.getDurationText(expire, expireType);
    const perCountCost =
      Math.ceil(((energyPerCount * pricePerCount) / 1000000) * 100) / 100;
    const amount = (count * perCountCost).toFixed(2);
    // const now = Math.floor(Date.now() / 1000);
    // const safeExpireAt = expireAt ?? now;
    // const remainSeconds = Math.max(0, safeExpireAt - now);
    // const remainMinutes = Math.max(1, Math.ceil(remainSeconds / 60));
    // const expireTimeText = formatTime(safeExpireAt);

    const text =
      `⏰ <b>时长租赁订单详情</b>\n` +
      `➖➖➖➖➖➖➖➖➖\n\n` +
      // `订单编号：<code>${applyId}</code>\n` +
      `租赁时长：${durationText}\n` +
      `能量笔数：${count} 笔 (${totalEnergy.toLocaleString()} 能量)\n` +
      `单笔费用：${perCountCost.toFixed(2)} TRX\n` +
      `订单金额：<b>${amount} TRX</b>\n` +
      `接收地址：<code>${targetAddr}</code>\n\n`;
    // `💳 <b>支付信息</b>\n` +
    // `收款地址：\n<code>${rechargeAddr ?? ""}</code>\n` +
    // `(点击地址自动复制)\n\n` +
    // `‼️ 请务必核对金额尾数，金额不对将无法确认。\n` +
    // `‼️ 请务必核对金额尾数，金额不对将无法确认。\n` +
    // `‼️ 请务必核对金额尾数，金额不对将无法确认。\n` +
    // `订单将于<b>${expireTimeText}</b>到期,请及时转账\n`;

    // callback_data 限制 64 字节，TRON 地址 34 字符会超限，改用短 key 存储
    const keyboard: TelegramBot.InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text: "余额支付",
            callback_data: `durationLeaseOrderByBalance:${orderKey}`,
          },
          { text: "取消订单", callback_data: "delete_message" },
        ],
      ],
    };

    return { text, keyboard };
  }

  // private buildDurationLeaseApplyMessage(
  //   applyId: number | string,
  //   amount: string,
  //   rechargeAddr: string | null,
  //   expireAt: number | null,
  //   count: number,
  //   energyPerCount: number,
  //   totalEnergy: number,
  //   expire: number,
  //   expireType: "D" | "H" | "M",
  //   pricePerCount: number,
  //   targetAddr: string
  // ): {
  //   text: string;
  //   keyboard: TelegramBot.InlineKeyboardMarkup;
  // } {
  //   const durationText = this.getDurationText(expire, expireType);
  //   const perCountCost =
  //     Math.ceil(((energyPerCount * pricePerCount) / 1000000) * 100) / 100;
  //   const now = Math.floor(Date.now() / 1000);
  //   const safeExpireAt = expireAt ?? now;
  //   const remainSeconds = Math.max(0, safeExpireAt - now);
  //   const remainMinutes = Math.max(1, Math.ceil(remainSeconds / 60));
  //   const expireTimeText = formatTime(safeExpireAt);

  //   const text =
  //     `⏰ <b>时长租赁订单详情</b>\n` +
  //     `➖➖➖➖➖➖➖➖➖\n\n` +
  //     // `订单编号：<code>${applyId}</code>\n` +
  //     `租赁时长：${durationText}\n` +
  //     `能量笔数：${count} 笔 (${totalEnergy.toLocaleString()} 能量)\n` +
  //     `单笔费用：${perCountCost.toFixed(2)} TRX\n` +
  //     `订单金额：<b>${amount} TRX</b>\n` +
  //     `接收地址：<code>${targetAddr}</code>\n\n` +
  //     `💳 <b>支付信息</b>\n` +
  //     `收款地址：\n<code>${rechargeAddr ?? ""}</code>\n` +
  //     `(点击地址自动复制)\n\n` +
  //     `‼️ 请务必核对金额尾数，金额不对将无法确认。\n` +
  //     `‼️ 请务必核对金额尾数，金额不对将无法确认。\n` +
  //     `‼️ 请务必核对金额尾数，金额不对将无法确认。\n` +
  //     `订单将于<b>${expireTimeText}</b>到期,请及时转账\n`;

  //   const keyboard: TelegramBot.InlineKeyboardMarkup = {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "余额支付",
  //           callback_data: `durationLeaseOrderByBalance:${applyId}`,
  //         },
  //         { text: "取消订单", callback_data: "delete_message" },
  //       ],
  //     ],
  //   };

  //   return { text, keyboard };
  // }

  private async sendOrderSuccessMessage(
    bot: TelegramBot,
    chatId: number,
    user: User,
    expire: number,
    expireType: "D" | "H" | "M",
    count: number,
    energyPerCount: number,
    toAddr: string,
    orderId?: number | string
  ): Promise<void> {
    const durationText = this.getDurationText(expire, expireType);
    // const totalEnergy = count * energyPerCount;

    const priceList = await this.orderService.getDurationLeasePriceList();
    // 应用用户价格浮动后再计算总价
    this.applyUserPriceFloat(priceList, user);
    const priceInfo = priceList.find(
      (p) => p.expire === expire && p.expireType === expireType
    );
    const pricePerCount = priceInfo ? parseFloat(priceInfo.price) : 0;
    const rawAmount = (energyPerCount * pricePerCount) / 1000000;
    const totalCost = Math.ceil(rawAmount * 100) / 100;

    const orderIdText = orderId ? `${orderId}` : "待生成";
    await bot.sendMessage(
      chatId,
      "✅ <b>订单创建成功！</b>\n\n" +
        `📋 <b>订单详情：</b>\n` +
        `订单号：<code>${orderIdText}</code>\n` +
        `租赁时长：${durationText}\n` +
        `能量数量：${count}笔 (${energyPerCount.toLocaleString()}能量)\n` +
        `订单金额：${totalCost.toFixed(2)} TRX\n` +
        `接收地址：${toAddr}\n\n` +
        "🚀 能量将在 1-3 秒内发送到您的钱包，请注意查收！",
      {
        parse_mode: "HTML",
      }
    );
  }
}
