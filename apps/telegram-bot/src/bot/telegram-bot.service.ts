import {Injectable, OnModuleDestroy, Logger, OnApplicationBootstrap} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import TelegramBot from "node-telegram-bot-api";
import {CommandsService} from "../commands/commands.service";
import {TronService} from "../services/tron.service";

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnModuleDestroy {
    private bot: TelegramBot | null = null;
    private readonly logger = new Logger(TelegramBotService.name);
    private blockCheckInterval: NodeJS.Timeout | null = null;
    private lastAlertTime: number = 0;
    private readonly ALERT_COOLDOWN = 60000;
    private isAlertSuppressed: boolean = false; // 新增：标记是否处于告警抑制状态
    private alertSuppressionStartTime: number = 0; // 新增：记录告警抑制开始时间
    private isInitialized = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly commandsService: CommandsService,
        private readonly tronService: TronService
    ) {
    }

    onApplicationBootstrap() {
        if (this.isInitialized) {
            this.logger.warn('TelegramBotService 已经初始化，跳过重复初始化');
            return;
        }

        this.isInitialized = true;
        this.logger.log('开始初始化 Telegram Bot...');

        const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '8734688749:AAHPpDeNJXZAO55guTuexwSCT_bH6WkbhsU';

        if (!token) {
            console.error(
                "TELEGRAM_BOT_TOKEN is not set. Telegram bot will not be started."
            );
            return;
        }

        const options: any = {
            polling: {
                params: {
                    timeout: 10,
                },
            },
        };

        this.bot = new TelegramBot(token, options);

        this.registerHandlers(this.bot);

        this.logger.log("Telegram bot started with polling mode");

        this.startBlockCheckTask();

    }
    onModuleDestroy() {
        if (this.blockCheckInterval) {
            clearInterval(this.blockCheckInterval);
            this.blockCheckInterval = null;
            this.logger.log('区块检查定时任务已停止');
        }
    }

    private startBlockCheckTask(): void {
        if (this.blockCheckInterval) {
            this.logger.warn('区块检查任务已在运行，跳过创建');
            return;
        }

        const fullNodeUrl = this.configService.get<string>('TRON_FULL_NODE') || 'https://api.trongrid.io';
        const solidNodeUrl = this.configService.get<string>('TRON_SOLID_NODE') || 'http://66.29.147.102:43921';
        const alertChatId = this.configService.get<string>('BLOCK_ALERT_CHAT_ID') || '-5239825684';
        const blockDiffThreshold = this.configService.get<number>('BLOCK_DIFF_THRESHOLD') || 15;

        if (!alertChatId) {
            this.logger.warn('BLOCK_ALERT_CHAT_ID 未配置，将不会发送告警消息');
            return;
        }

        this.logger.log(`开始区块高度检查任务，间隔3秒`);
        this.logger.log(`Full Node: ${fullNodeUrl}, Solid Node: ${solidNodeUrl}`);
        this.logger.log(`区块高度差异告警阈值: ${blockDiffThreshold}`);

        let lastSuccessTime = Date.now();
        let consecutiveFailures = 0;
        const FAILURE_THRESHOLD = 10 * 60 * 1000; // 10分钟
        let hasSentFailureAlert = false;

        this.blockCheckInterval = setInterval(async () => {
            const now = Date.now();
            
            try {
                const [latestBlockNumber, localBlockNumber] = await Promise.all([
                    this.tronService.getLatestBlockNumber(fullNodeUrl),
                    this.tronService.getNodeBlockNumber(solidNodeUrl),
                ]);

                const diff = Math.abs(latestBlockNumber - localBlockNumber);

                this.logger.log(`区块高度差异: ${diff}`);
                
                // 更新成功时间，重置失败计数
                lastSuccessTime = Date.now();
                consecutiveFailures = 0;
                hasSentFailureAlert = false;

                if (diff > blockDiffThreshold) {
                    // 检查是否需要进入告警抑制状态
                    if (!this.isAlertSuppressed) {
                        // 如果还没有进入抑制状态，检查是否已经持续告警超过10分钟
                        if (this.alertSuppressionStartTime === 0) {
                            // 记录首次超阈值时间
                            this.alertSuppressionStartTime = now;
                        } else if (now - this.alertSuppressionStartTime >= 10 * 60 * 1000) { // 10分钟
                            // 持续超阈值超过10分钟，进入告警抑制状态
                            this.isAlertSuppressed = true;
                            this.logger.warn(`区块高度差异持续超过阈值10分钟，进入告警抑制状态`);

                            // 发送告警抑制通知
                            const suppressionMessage = `⚠️ 区块高度差异持续超过阈值超过10分钟，暂时停止发送告警\n\n` +
                                `最新区块: ${latestBlockNumber}\n` +
                                `本地节点: ${localBlockNumber}\n` +
                                `差值: ${diff} (阈值: ${blockDiffThreshold})\n` +
                                `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                                `系统将在区块高度恢复正常后重新发送通知。`;

                            await this.sendMessageToUser(alertChatId, suppressionMessage);
                        } else {
                            // 在10分钟内，正常发送告警（受冷却时间控制）
                            if (now - this.lastAlertTime >= this.ALERT_COOLDOWN) {
                                const message = `⚠️ 区块高度异常告警\n\n` +
                                    `最新区块: ${latestBlockNumber}\n` +
                                    `本地节点: ${localBlockNumber}\n` +
                                    `差值: ${diff} \n` +
                                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

                                await this.sendMessageToUser(alertChatId, message);
                                this.lastAlertTime = now;
                                this.logger.warn(`区块高度差异过大: ${diff}, 已发送告警`);
                            }
                        }
                    }
                    // 如果已经在告警抑制状态，则不发送任何告警
                } else {
                    // 区块高度恢复正常
                    if (this.isAlertSuppressed) {
                        // 从告警抑制状态恢复，发送恢复正常通知
                        this.isAlertSuppressed = false;
                        this.alertSuppressionStartTime = 0;

                        const recoveryMessage = `✅ 区块高度差异恢复正常\n\n` +
                            `最新区块: ${latestBlockNumber}\n` +
                            `本地节点: ${localBlockNumber}\n` +
                            `差值: ${diff} \n` +
                            `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                            `系统将恢复正常的告警机制。`;

                        await this.sendMessageToUser(alertChatId, recoveryMessage);
                        this.logger.log(`区块高度差异恢复正常: ${diff}, 已发送恢复通知`);
                    } else {
                        // 正常情况下的日志记录
                        this.alertSuppressionStartTime = 0; // 重置开始时间
                    }
                }
            } catch (error) {
                consecutiveFailures++;
                const timeSinceLastSuccess = now - lastSuccessTime;
                
                this.logger.error(`检查区块高度失败 (${consecutiveFailures}次): ${error instanceof Error ? error.message : String(error)}`);
                
                // 如果失败时间超过10分钟且还未发送过告警
                if (timeSinceLastSuccess >= FAILURE_THRESHOLD && !hasSentFailureAlert) {
                    const failureDuration = Math.floor(timeSinceLastSuccess / 1000 / 60);
                    const message = `🚨 区块高度检查持续失败告警\n\n` +
                        `失败时长: ${failureDuration} 分钟\n` +
                        `连续失败次数: ${consecutiveFailures}\n` +
                        `最后成功时间: ${new Date(lastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                        `当前时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                        `请检查节点连接是否正常！`;

                    await this.sendMessageToUser(alertChatId, message);
                    hasSentFailureAlert = true;
                    this.logger.error(`已发送持续失败告警，失败时长: ${failureDuration}分钟`);
                }
            }
        }, 3000);
    }

    async sendMessageToUser(telegramId: string, text: string): Promise<void> {
        if (!this.bot) {
            return;
        }
        const chatId = Number(telegramId);
        if (!Number.isFinite(chatId)) {
            return;
        }
        await this.bot.sendMessage(chatId, text, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
        });
    }

    private registerHandlers(bot: TelegramBot) {
        // 注册命令（/start /me 等）
        this.commandsService.registerCommands(bot);

        bot.on("polling_error", (err) => {
            this.logger.error(`Telegram 网络波动: ${err.message || err}`);
            this.logger.error(`错误详情: ${JSON.stringify(err)}`);
        });
    }
}
