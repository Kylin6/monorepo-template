import { Injectable, Logger } from "@nestjs/common";
import TelegramBot = require("node-telegram-bot-api");
import { CallbackQuery, Message } from "node-telegram-bot-api";
import { User } from "@database/index";
import { TaskService } from "../services/task.service";
import { TaskNameConstants } from "../common/constants/menu-text.constants";
import { UserService } from "../services/user.service";
import { RechargeHandler } from "./text-handlers/recharge.handler";
import { SysCfgService } from "../services/syscfg.service";
import { DurationLeaseHandler } from "./text-handlers/duration-lease.handler";
import { BuyTrxHandler } from "./text-handlers/buy-trx.handler";
import { OrderService } from "../services/order.service";
import { formatTime } from "../utils/helpers.util";

@Injectable()
export class CallbackHandler {
  private readonly logger = new Logger(CallbackHandler.name);
  private readonly orderMessageMap: Map<
    number,
    { chatId: number; messageId: number }
  > = new Map();
  constructor(
    private readonly state: TaskService,
    private readonly userService: UserService,
    private readonly sysCfgService: SysCfgService,
    private readonly rechargeHandler: RechargeHandler,
    private readonly durationLeaseHandler: DurationLeaseHandler,
    private readonly buyTrxHandler: BuyTrxHandler,
    private readonly orderService: OrderService,
  ) {}

  /**
   * 处理回调查询（内联按钮点击）
   */
  async handle(
    bot: TelegramBot,
    query: CallbackQuery,
    user: User,
  ): Promise<void> {
    // 仅处理私聊回调
    if (query.message?.chat?.type !== "private") {
      return;
    }
    const chatId = query.message?.chat.id;
    const data = query.data;
    const telegramId = query.from?.id?.toString() || "";

    if (!chatId || !data) {
      return;
    }

    try {
      // 先回答回调查询，避免按钮一直显示加载状态
      await bot.answerCallbackQuery(query.id);

      // 根据不同的 callback_data 处理不同的操作
      // 处理充值相关的回调（recharge:TRX:100, recharge:USDT:custom 等）
      if (data.startsWith("recharge:")) {
        await this.handleRechargeSel(bot, query, user);
        return;
      }
      // 处理时长租赁相关的回调 - 权限码 30
      if (data.startsWith("duration_lease:")) {
        // if (
        //   !agentInfo?.activePermissions ||
        //   !PermissionUtil.hasPermission(
        //     agentInfo.activePermissions,
        //     PermissionUtil.PERMISSION_CODES.DURATION_LEASE
        //   )
        // ) {
        //   await bot.sendMessage(chatId, "❌ 您没有使用此功能的权限。");
        //   return;
        // }
        await this.handleDurationLease(bot, query, telegramId);
        return;
      }
      // 时长租赁余额支付 - 权限码 30
      if (data.startsWith("durationLeaseOrderByBalance:")) {
        await this.durationLeaseHandler.handleDurationLeaseBalancePay(
          bot,
          query,
        );
        return;
      }
      // 处理智能托管列表
      if (data.startsWith("smart_lease_list")) {
        const parts = data.split(":");
        const page = parts[1] ? Math.max(1, Number(parts[1])) : 1;
        const shouldEdit = parts.length > 1; // 含页码的表示分页，编辑当前消息
        const telegramId = query.from?.id?.toString() || "";
        await this.handleSmartAddressList(
          bot,
          chatId,
          telegramId,
          page,
          query.message?.message_id,
          shouldEdit,
        );
        return;
      }
      // 处理智能托管 - 权限码 60
      if (data.startsWith("smart_lease_add:")) {
        await this.handleSmartLeaseAdd(bot, query);
        return;
      }
      // 处理智能托管输入地址 - 权限码 60
      if (data.startsWith("smart_lease_input_addr:")) {
        await this.handleSmartLeaseInputAddr(bot, query);
        return;
      }
      switch (data) {
        case "delete_message":
          if (query.message?.message_id) {
            try {
              await bot.deleteMessage(chatId, query.message.message_id);
            } catch (e) {
              this.logger.warn("删除消息失败，尝试隐藏按钮", e);
              try {
                await bot.editMessageReplyMarkup(
                  { inline_keyboard: [] },
                  { chat_id: chatId, message_id: query.message?.message_id },
                );
              } catch {}
            }
          }
          break;
        case "updatemyaddr:0":
          await this.handleBindAddress(bot, chatId);
          break;
        case "cancel_task":
          await this.handleCancelTask(bot, chatId);
          break;
        case "my_address":
          await this.handleMyAddress(bot, chatId, telegramId);
          break;
        case "rechargemenu:trx":
          if (query.message) {
            await this.handleRecharge(bot, query.message, user, query.from);
          }
          break;
        // case "count_address_list":
        //   await this.handleCountAddressList(bot, chatId, agentUid);
        //   break;
        default:
          this.logger.warn(`未知的回调查询: ${data}`);
          await bot.sendMessage(chatId, "未知的操作，请重试。");
      }
    } catch (error) {
      this.logger.error(
        `处理回调查询失败 (chatId: ${chatId}, data: ${data}):`,
        error,
      );
      try {
        await bot.sendMessage(chatId, "处理您的请求时发生错误，请稍后重试。");
      } catch (sendError) {
        this.logger.error("发送错误消息失败:", sendError);
      }
    }
  }

  /**
   * 处理绑定/更换地址
   */
  private async handleBindAddress(
    bot: TelegramBot,
    chatId: number,
  ): Promise<void> {
    // 开启"等待输入地址"的任务状态
    this.state.setTask(chatId, TaskNameConstants.TASK_BIND_ADDRESS);
    await bot.sendMessage(chatId, "请发送您的钱包地址：", {
      parse_mode: "HTML",
    });
  }

  /**
   * 处理关闭任务
   */
  private async handleCancelTask(
    bot: TelegramBot,
    chatId: number,
  ): Promise<void> {
    // 清除任务状态
    this.state.clearTask(chatId);
    await bot.sendMessage(
      chatId,
      "✅ 已取消当前任务，您可以正常使用菜单功能。",
    );
  }

  /**
   * 处理查看我的地址
   */
  private async handleMyAddress(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
  ): Promise<void> {
    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      await bot.sendMessage(
        chatId,
        "未找到您的用户信息，请先使用 /start 初始化。",
      );
      return;
    }
    if (!user.walletAddr) {
      const CenterKeyboard = {
        inline_keyboard: [
          [{ text: "绑定地址", callback_data: "updatemyaddr:0" }],
        ],
      };
      await bot.sendMessage(chatId, "您还没有常用地址，请先绑定地址。", {
        parse_mode: "HTML",
        reply_markup: CenterKeyboard,
      });
      return;
    }

    const MyAddressKeyboard = {
      inline_keyboard: [
        [
          { text: "更换地址", callback_data: "updatemyaddr:0" },
          { text: "❌ 关闭", callback_data: "delete_message" },
        ],
      ],
    };
    await bot.sendMessage(
      chatId,
      `<b>您的常用地址：</b> \n<code>${user.walletAddr}</code>`,
      {
        parse_mode: "HTML",
        reply_markup: MyAddressKeyboard,
      },
    );
    return;
  }

  private async handleRecharge(
    bot: TelegramBot,
    msg: Message,
    user: User,
    from?: any,
  ): Promise<void> {
    // 调用 RechargeHandler 的 execute 方法来显示充值界面
    await this.rechargeHandler.execute(bot, msg, user);
  }

  private async handleRechargeSel(
    bot: TelegramBot,
    query: CallbackQuery,
    user: User,
  ): Promise<void> {
    // 调用 RechargeHandler 的 handleRechargeSelection 方法处理充值选择
    await this.rechargeHandler.handleRechargeSelection(bot, query, user);
  }
  /**
   * 从消息文本中解析当前选中的状态
   */
  private parseDurationLeaseState(messageText: string): {
    expire: number;
    expireType: "D" | "H" | "M";
    count: number;
  } {
    // 默认值
    let expire = 10;
    let expireType: "D" | "H" | "M" = "M";
    let count = 1;

    try {
      // 解析租赁时长
      const durationMatch = messageText.match(
        /租赁时长:\s*(\d+)(分钟|小时|天)/,
      );
      if (durationMatch) {
        expire = parseInt(durationMatch[1]);
        const unit = durationMatch[2];
        if (unit === "分钟") {
          expireType = "M";
        }
        if (unit === "小时") {
          expireType = "H";
        }
        if (unit === "天") {
          expireType = "D";
        }
      }

      // 解析能量数量
      const countMatch = messageText.match(/能量数量:\s*(\d+)笔/);
      if (countMatch) {
        count = parseInt(countMatch[1]);
      }
    } catch (error) {
      this.logger.warn("解析时长租赁状态失败，使用默认值:", error);
    }

    return { expire, expireType, count };
  }

  /**
   * 处理时长租赁相关的回调
   */
  private async handleDurationLease(
    bot: TelegramBot,
    query: CallbackQuery,
    telegramId: string,
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;

    if (!chatId || !messageId || !data) {
      return;
    }

    try {
      const parts = data.split(":");
      const action = parts[1]; // duration, count, pay, other_address

      if (action === "noop") {
        await bot.answerCallbackQuery(query.id, {
          text: "请选择下方笔数开始下单",
          show_alert: false,
        });
        return;
      }

      // 新版键盘：duration_lease:count:<expire>:<expireType>:<count>
      if (action === "count" && parts.length >= 5) {
        const expire = parseInt(parts[2], 10);
        const expireType = (parts[3]?.toUpperCase() as "D" | "H" | "M") || "M";
        const count = parseInt(parts[4], 10) || 1;

        if (!expire || !["D", "H", "M"].includes(expireType)) {
          await bot.answerCallbackQuery(query.id, {
            text: "配置无效，请稍后重试",
            show_alert: true,
          });
          return;
        }

        await this.startDurationLeaseAddressTask(
          bot,
          chatId,
          expire,
          expireType as "D" | "H" | "M",
          count,
        );
        return;
      }

      // // 兼容旧版按钮
      // const currentState = this.parseDurationLeaseState(
      //   query.message?.text || ""
      // );

      // let newExpire = currentState.expire;
      // let newExpireType = currentState.expireType;
      // let newCount = currentState.count;

      // if (action === "duration") {
      //   newExpire = parseInt(parts[2]);
      //   newExpireType = parts[3] as "D" | "H" | "M";

      //   if (
      //     newExpire === currentState.expire &&
      //     newExpireType === currentState.expireType
      //   ) {
      //     await bot.answerCallbackQuery(query.id, {
      //       text: "该选项已选中",
      //       show_alert: false,
      //     });
      //     return;
      //   }
      // } else if (action === "count" && parts.length === 3) {
      //   newCount = parseInt(parts[2]);

      //   if (newCount === currentState.count) {
      //     await bot.answerCallbackQuery(query.id, {
      //       text: "该选项已选中",
      //       show_alert: false,
      //     });
      //     return;
      //   }
      // } else if (action === "other_address") {
      //   await this.handleOtherEnergyAddress(bot, query, agentUid, telegramId);
      //   return;
      // } else if (action === "pay") {
      //   await this.durationLeaseHandler.handlePayOrder(
      //     bot,
      //     query,
      //     agentUid,
      //     telegramId
      //   );
      //   return;
      // }

      // const { text, keyboard } = await this.durationLeaseHandler.getView(
      //   telegramId,
      //   newExpire,
      //   newExpireType,
      //   newCount
      // );

      // await bot.editMessageText(text, {
      //   chat_id: chatId,
      //   message_id: messageId,
      //   parse_mode: "HTML",
      //   reply_markup: keyboard,
      // } as any);
    } catch (error) {
      this.logger.error(
        `处理时长租赁回调失败 (chatId: ${chatId}, data: ${data}):`,
        error,
      );
      await bot.answerCallbackQuery(query.id, {
        text: "❌ 操作失败，请稍后重试",
      });
    }
  }

  private async startDurationLeaseAddressTask(
    bot: TelegramBot,
    chatId: number,
    expire: number,
    expireType: "D" | "H" | "M",
    count: number,
  ): Promise<void> {
    const sysCfgValues = await this.sysCfgService.getSysCfgValues();
    const energyPerCount = Number(sysCfgValues.singleAmount ?? 65000);
    const totalEnergy = count * energyPerCount;

    this.state.setTask(chatId, TaskNameConstants.TASK_FOR_OTHER_ENERGY, {
      amount: totalEnergy,
      expire,
      expireType,
      count,
    });

    const durationText = this.durationLeaseHandler.getDurationText(
      expire,
      expireType,
    );

    await bot.sendMessage(chatId, `请输入能量接收地址:`);
  }

  // 显示智能托管订单列表 （分页）
  private async handleSmartAddressList(
    bot: TelegramBot,
    chatId: number,
    telegramId: string,
    page: number,
    messageId?: number,
    shouldEdit: boolean = false,
  ) {
    try {
      // 查找当前用户
      const user = await this.userService.findByTelegramId(telegramId);
      if (!user) {
        await bot.sendMessage(
          chatId,
          "❌ 未找到您的用户信息，请先使用 /start 初始化。",
        );
        return;
      }

      const pageSize = 5;
      const { list: plans, total } = await this.orderService.findUserPlanOrders(
        user.id,
        page,
        pageSize,
      );

      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const runningPlans = plans.filter((plan) => plan.status === 10);
      // const stoppedPlans = plans.filter((plan) => plan.status === 0);

      const lines: string[] = [];
      lines.push("🤖 <b>智能托管列表:</b>");
      lines.push("➖➖➖➖➖➖➖➖➖➖\n");

      const renderPlan = (plan: any, index: number, actionLabel: string) => {
        const withBandwidth =
          plan.withBandwidth === 10 ? "购买带宽" : "不购买带宽";
        const createdAt =
          plan.createdAt && plan.createdAt > 0
            ? formatTime(plan.createdAt)
            : "--";
        return (
          `${index}. 地址: <code>${plan.toAddr}</code>\n` +
          `类型: ${plan.limit.toLocaleString()}能量 (${withBandwidth})\n` +
          `创建时间: ${createdAt}\n` +
          `${actionLabel}: /stopauto${plan.planId}\n` +
          // `${actionLabel}: /${actionLabel === "停止" ? "stopauto" : "openauto"}${plan.planId}\n` +
          // `${plan.status === 0 ? "删除: " + `/delauto${plan.planId}` : ""}\n` +
          `➖➖➖➖➖➖➖➖➖➖\n`
        );
      };

      if (runningPlans.length > 0) {
        lines.push("<b>运行中的地址：</b>\n");
        runningPlans.forEach((plan, idx) => {
          lines.push(renderPlan(plan, idx + 1, "停止"));
        });
      }

      // if (stoppedPlans.length > 0) {
      //   lines.push("<b>已停止的地址：</b>\n");
      //   stoppedPlans.forEach((plan, idx) => {
      //     lines.push(renderPlan(plan, idx + 1, "开启"));
      //   });
      // }

      if (!plans.length) {
        lines.push("暂无托管地址记录。\n");
      }

      lines.push("💡 <b>说明：</b>");
      lines.push(" 使用 /stopautoXX 指令停止指定计划。");
      const keyboard = {
        inline_keyboard: [
          [
            ...(page > 1
              ? [
                  {
                    text: "⬅️ 上一页",
                    callback_data: `smart_lease_list:${page - 1}`,
                  },
                ]
              : []),
            {
              text: `第 ${page}/${totalPages} 页`,
              callback_data: "noop",
            },
            ...(page < totalPages
              ? [
                  {
                    text: "下一页 ➡️",
                    callback_data: `smart_lease_list:${page + 1}`,
                  },
                ]
              : []),
          ],
          [{ text: "❌ 关闭", callback_data: "delete_message" }],
        ],
      };
      const text = lines.join("\n");

      if (shouldEdit && messageId) {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: keyboard,
        } as any);
      } else {
        await bot.sendMessage(chatId, text, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: keyboard,
        });
      }
    } catch (error) {
      this.logger.error("加载智能托管地址列表失败:", error);
      await bot.sendMessage(chatId, "❌ 加载地址列表失败，请稍后重试。");
    }
  }
  // 处理智能托管新增地址
  private async handleSmartLeaseAdd(
    bot: TelegramBot,
    query: CallbackQuery,
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;
    if (!chatId || !messageId || !data) {
      return;
    }
    // const withBandwidth = data.split(":")[1];
    // if (!withBandwidth) {
    //   return;
    // }
    // console.log("withBandwidth", withBandwidth);
    const sysCfgValues = await this.sysCfgService.getSysCfgValues();
    const energyPerCount = Number(sysCfgValues.singleAmount ?? 65000);
    const energyPerCount2 = Number(sysCfgValues.countAmount ?? 130000);
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: `两笔(${energyPerCount2.toLocaleString()}能量)`,
            callback_data: `smart_lease_input_addr:0:${energyPerCount2}`,
          },
          {
            text: `一笔(${energyPerCount.toLocaleString()}能量)`,
            callback_data: `smart_lease_input_addr:0:${energyPerCount}`,
          },
        ],
        [
          {
            text: `两笔(${energyPerCount2.toLocaleString()}能量)包带宽`,
            callback_data: `smart_lease_input_addr:10:${energyPerCount2}`,
          },
          {
            text: `一笔(${energyPerCount.toLocaleString()}能量)包带宽`,
            callback_data: `smart_lease_input_addr:10:${energyPerCount}`,
          },
        ],
      ],
    };

    const text = `请选择托管套餐`;
    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }
  // 处理智能托管输入地址
  private async handleSmartLeaseInputAddr(
    bot: TelegramBot,
    query: CallbackQuery,
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;
    if (!chatId || !messageId || !data) {
      return;
    }
    const withBandwidth = data.split(":")[1];
    if (!withBandwidth) {
      return;
    }
    const energyAmount = data.split(":")[2];
    if (!energyAmount) {
      return;
    }
    const extra = {
      withBandwidth,
      energyAmount,
    };

    // 开启"其他能量地址"的任务状态
    this.state.setTask(chatId, TaskNameConstants.TASK_FOR_AUTO_ORDER, extra);
    const text = `📍 请输入接收能量的钱包地址：`;
    await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
  }
}
