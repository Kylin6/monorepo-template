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
        const solidNodeUrl1 = this.configService.get<string>('TRON_SOLID_NODE_1') || 'http://66.29.147.102:43921';
        const solidNodeUrl2 = this.configService.get<string>('TRON_SOLID_NODE_2') || 'http://66.29.147.112:43921';
        const alertChatId = this.configService.get<string>('BLOCK_ALERT_CHAT_ID') || '-5239825684';
        const blockDiffThreshold = this.configService.get<number>('BLOCK_DIFF_THRESHOLD') || 15;

        if (!alertChatId) {
            this.logger.warn('BLOCK_ALERT_CHAT_ID 未配置，将不会发送告警消息');
            return;
        }

        this.logger.log(`开始区块高度检查任务，间隔3秒`);
        this.logger.log(`Full Node: ${fullNodeUrl}`);
        this.logger.log(`Solid Node 1: ${solidNodeUrl1}`);
        this.logger.log(`Solid Node 2: ${solidNodeUrl2}`);
        this.logger.log(`区块高度差异告警阈值: ${blockDiffThreshold}`);

        const FAILURE_THRESHOLD = 60 * 1000; // 1分钟
        
        // 分别跟踪两个节点的状态
        let node1Failed = false;
        let node2Failed = false;
        let node1FailureStartTime = 0;
        let node2FailureStartTime = 0;
        let node1HasSentAlert = false;
        let node2HasSentAlert = false;
        let node1ConsecutiveFailures = 0;
        let node2ConsecutiveFailures = 0;
        let node1LastSuccessTime = Date.now();
        let node2LastSuccessTime = Date.now();

        this.blockCheckInterval = setInterval(async () => {
            const now = Date.now();
            
            // 分别请求三个节点，独立处理每个节点的结果
            const [fullNodeResult, node1Result, node2Result] = await Promise.allSettled([
                this.tronService.getLatestBlockNumber(fullNodeUrl),
                this.tronService.getNodeBlockNumber(solidNodeUrl1),
                this.tronService.getNodeBlockNumber(solidNodeUrl2),
            ]);

            // 处理全节点结果
            if (fullNodeResult.status === 'rejected') {
                this.logger.error(`全节点请求失败: ${fullNodeResult.reason instanceof Error ? fullNodeResult.reason.message : String(fullNodeResult.reason)}`);
            }

            // 处理节点102
            if (node1Result.status === 'fulfilled' && fullNodeResult.status === 'fulfilled') {
                const localBlockNumber1 = node1Result.value;
                const latestBlockNumber = fullNodeResult.value;
                const diff1 = Math.abs(latestBlockNumber - localBlockNumber1);

                // this.logger.log(`节点102 区块高度差异: ${diff1}`);
                
                // 检查节点102是否恢复
                if (node1Failed) {
                    const failureDuration = Math.floor((now - node1FailureStartTime) / 1000);
                    if (failureDuration >= 60 && node1HasSentAlert) {
                        const recoveryMessage = `✅ 节点102连接已恢复正常\n\n` +
                            `节点地址: ${solidNodeUrl1}\n` +
                            `最后成功时间: ${new Date(node1LastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                            `故障时长: ${failureDuration} 秒\n` +
                            `当前区块高度: ${localBlockNumber1}\n` +
                            `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                            `系统已恢复正常的区块监控。`;

                        await this.sendMessageToUser(alertChatId, recoveryMessage);
                        this.logger.log(`节点102连接已恢复，故障时长: ${failureDuration}秒`);
                    }
                    node1Failed = false;
                    node1FailureStartTime = 0;
                    node1HasSentAlert = false;
                    node1ConsecutiveFailures = 0;
                }
                
                // 更新节点102成功时间
                node1LastSuccessTime = Date.now();

                // 检查节点102的区块高度差异
                if (diff1 > blockDiffThreshold) {
                    await this.handleBlockDiffAlert(
                        '节点102',
                        solidNodeUrl1,
                        latestBlockNumber,
                        localBlockNumber1,
                        diff1,
                        blockDiffThreshold,
                        alertChatId,
                        now
                    );
                }
            } else if (node1Result.status === 'rejected') {
                // 节点102请求失败
                node1ConsecutiveFailures++;
                const timeSinceLastSuccess = now - node1LastSuccessTime;
                
                this.logger.error(`节点102检查失败 (${node1ConsecutiveFailures}次): ${node1Result.reason instanceof Error ? node1Result.reason.message : String(node1Result.reason)}`);
                
                // 标记节点102失败
                if (!node1Failed) {
                    node1Failed = true;
                    node1FailureStartTime = now;
                }
                
                // 如果失败时间超过1分钟且还未发送过告警
                if (timeSinceLastSuccess >= FAILURE_THRESHOLD && !node1HasSentAlert) {
                    const failureDuration = Math.floor(timeSinceLastSuccess / 1000);
                    const message = `🚨 节点102连接持续失败告警\n\n` +
                        `节点地址: ${solidNodeUrl1}\n` +
                        `失败时长: ${failureDuration} 秒\n` +
                        `连续失败次数: ${node1ConsecutiveFailures}\n` +
                        `最后成功时间: ${new Date(node1LastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                        `当前时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                        `请检查节点连接是否正常！`;

                    await this.sendMessageToUser(alertChatId, message);
                    node1HasSentAlert = true;
                    this.logger.error(`已发送节点102持续失败告警，失败时长: ${failureDuration}秒`);
                }
            }

            // 处理节点112
            if (node2Result.status === 'fulfilled' && fullNodeResult.status === 'fulfilled') {
                const localBlockNumber2 = node2Result.value;
                const latestBlockNumber = fullNodeResult.value;
                const diff2 = Math.abs(latestBlockNumber - localBlockNumber2);

                // this.logger.log(`节点112 区块高度差异: ${diff2}`);
                
                // 检查节点112是否恢复
                if (node2Failed) {
                    const failureDuration = Math.floor((now - node2FailureStartTime) / 1000);
                    if (failureDuration >= 60 && node2HasSentAlert) {
                        const recoveryMessage = `✅ 节点112连接已恢复正常\n\n` +
                            `节点地址: ${solidNodeUrl2}\n` +
                            `最后成功时间: ${new Date(node2LastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                            `故障时长: ${failureDuration} 秒\n` +
                            `当前区块高度: ${localBlockNumber2}\n` +
                            `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                            `系统已恢复正常的区块监控。`;

                        await this.sendMessageToUser(alertChatId, recoveryMessage);
                        this.logger.log(`节点112连接已恢复，故障时长: ${failureDuration}秒`);
                    }
                    node2Failed = false;
                    node2FailureStartTime = 0;
                    node2HasSentAlert = false;
                    node2ConsecutiveFailures = 0;
                }
                
                // 更新节点112成功时间
                node2LastSuccessTime = Date.now();

                // 检查节点112的区块高度差异
                if (diff2 > blockDiffThreshold) {
                    await this.handleBlockDiffAlert(
                        '节点112',
                        solidNodeUrl2,
                        latestBlockNumber,
                        localBlockNumber2,
                        diff2,
                        blockDiffThreshold,
                        alertChatId,
                        now
                    );
                }
            } else if (node2Result.status === 'rejected') {
                // 节点112请求失败
                node2ConsecutiveFailures++;
                const timeSinceLastSuccess = now - node2LastSuccessTime;
                
                this.logger.error(`节点112检查失败 (${node2ConsecutiveFailures}次): ${node2Result.reason instanceof Error ? node2Result.reason.message : String(node2Result.reason)}`);
                
                // 标记节点112失败
                if (!node2Failed) {
                    node2Failed = true;
                    node2FailureStartTime = now;
                }
                
                // 如果失败时间超过1分钟且还未发送过告警
                if (timeSinceLastSuccess >= FAILURE_THRESHOLD && !node2HasSentAlert) {
                    const failureDuration = Math.floor(timeSinceLastSuccess / 1000);
                    const message = `🚨 节点112连接持续失败告警\n\n` +
                        `节点地址: ${solidNodeUrl2}\n` +
                        `失败时长: ${failureDuration} 秒\n` +
                        `连续失败次数: ${node2ConsecutiveFailures}\n` +
                        `最后成功时间: ${new Date(node2LastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                        `当前时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                        `请检查节点连接是否正常！`;

                    await this.sendMessageToUser(alertChatId, message);
                    node2HasSentAlert = true;
                    this.logger.error(`已发送节点112持续失败告警，失败时长: ${failureDuration}秒`);
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

    /**
     * 处理单个节点的区块高度差异告警
     */
    private async handleBlockDiffAlert(
        nodeName: string,
        nodeUrl: string,
        latestBlockNumber: number,
        localBlockNumber: number,
        diff: number,
        threshold: number,
        alertChatId: string,
        now: number
    ): Promise<void> {
        // 检查是否需要进入告警抑制状态
        if (!this.isAlertSuppressed) {
            // 如果还没有进入抑制状态，检查是否已经持续告警超过10分钟
            if (this.alertSuppressionStartTime === 0) {
                // 记录首次超阈值时间
                this.alertSuppressionStartTime = now;
            } else if (now - this.alertSuppressionStartTime >= 10 * 60 * 1000) { // 10分钟
                // 持续超阈值超过10分钟，进入告警抑制状态
                this.isAlertSuppressed = true;
                this.logger.warn(`${nodeName} 区块高度差异持续超过阈值10分钟，进入告警抑制状态`);

                // 发送告警抑制通知
                const suppressionMessage = `⚠️ ${nodeName} 区块高度差异持续超过阈值超过10分钟，暂时停止发送告警\n\n` +
                    `节点地址: ${nodeUrl}\n` +
                    `最新区块: ${latestBlockNumber}\n` +
                    `本地节点: ${localBlockNumber}\n` +
                    `差值: ${diff} (阈值: ${threshold})\n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                    `系统将在区块高度恢复正常后重新发送通知。`;

                await this.sendMessageToUser(alertChatId, suppressionMessage);
            } else {
                // 在10分钟内，正常发送告警（受冷却时间控制）
                if (now - this.lastAlertTime >= this.ALERT_COOLDOWN) {
                    const message = `⚠️ ${nodeName} 区块高度异常告警\n\n` +
                        `节点地址: ${nodeUrl}\n` +
                        `最新区块: ${latestBlockNumber}\n` +
                        `本地节点: ${localBlockNumber}\n` +
                        `差值: ${diff} \n` +
                        `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

                    await this.sendMessageToUser(alertChatId, message);
                    this.lastAlertTime = now;
                    this.logger.warn(`${nodeName} 区块高度差异过大: ${diff}, 已发送告警`);
                }
            }
        }
        // 如果已经在告警抑制状态，则不发送任何告警
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
