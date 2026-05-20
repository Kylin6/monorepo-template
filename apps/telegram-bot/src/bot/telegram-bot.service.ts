import {Injectable, OnModuleDestroy, Logger, OnApplicationBootstrap} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import TelegramBot from "node-telegram-bot-api";
import {CommandsService} from "../commands/commands.service";
import {TronService} from "../services/tron.service";
import {MonitorService} from "../services/monitor.service";

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnModuleDestroy {
    private bot: TelegramBot | null = null;
    private readonly logger = new Logger(TelegramBotService.name);
    private blockCheckInterval: NodeJS.Timeout | null = null;
    private lastAlertTime: number = 0;
    private readonly ALERT_COOLDOWN = 60000;
    private isInitialized = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly commandsService: CommandsService,
        private readonly tronService: TronService,
        private readonly monitorService: MonitorService
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
        // 本地节点数组（从环境变量中读取逗号分隔的字符串）
        const solidNodesStr = this.configService.get<string>('TRON_SOLID_NODES') || 
            'http://66.29.147.102:43921,http://45.137.213.34:43921';
        const solidNodes = solidNodesStr.split(',').map(url => url.trim()).filter(url => url.length > 0);
        
        if (solidNodes.length === 0) {
            this.logger.error('TRON_SOLID_NODES 未配置或格式错误，区块监控任务无法启动');
            return;
        }
        const alertChatId = this.configService.get<string>('BLOCK_ALERT_CHAT_ID') || '-5239825684';
        const blockDiffThreshold = this.configService.get<number>('BLOCK_DIFF_THRESHOLD') || 15;

        if (!alertChatId) {
            this.logger.warn('BLOCK_ALERT_CHAT_ID 未配置，将不会发送告警消息');
            return;
        }

        this.logger.log(`开始区块高度检查任务，间隔3秒`);
        this.logger.log(`Full Node: ${fullNodeUrl}`);
        solidNodes.forEach((node, index) => {
            this.logger.log(`Solid Node ${index + 1}: ${node}`);
        });
        this.logger.log(`区块高度差异告警阈值: ${blockDiffThreshold}`);

        const FAILURE_THRESHOLD = 60 * 1000; // 1分钟
        const PERSISTENT_ALERT_INTERVAL = 10 * 60 * 1000; // 10分钟 - 持续失败告警间隔
        const SUPPRESSION_THRESHOLD = 30 * 60 * 1000; // 30分钟 - 告警抑制阈值
        
        // 跟踪每个节点的状态
        const nodeStates = solidNodes.map(() => ({
            failed: false,
            failureStartTime: 0,
            consecutiveFailures: 0,
            lastSuccessTime: Date.now(),
            isSuppressed: false,
            suppressionStartTime: 0,
            lastAlertTime: 0,
        }));

        this.blockCheckInterval = setInterval(async () => {
            // 检查监控是否已启用
            if (!this.monitorService.isMonitoringActive()) {
                return;
            }

            const now = Date.now();
            
            // 请求全节点
            const fullNodeResult = await this.tronService.getLatestBlockNumber(fullNodeUrl).catch(err => {
                this.logger.error(`全节点请求失败: ${err instanceof Error ? err.message : String(err)}`);
                return null;
            });

            // 循环处理每个本地节点
            for (let i = 0; i < solidNodes.length; i++) {
                const solidNodeUrl = solidNodes[i];
                const state = nodeStates[i];
                
                await this.processSingleNode(
                    solidNodeUrl,
                    fullNodeResult,
                    state,
                    now,
                    blockDiffThreshold,
                    alertChatId,
                    FAILURE_THRESHOLD,
                    PERSISTENT_ALERT_INTERVAL,
                    SUPPRESSION_THRESHOLD
                );
            }
        }, 3000);
    }

    /**
     * 处理单个本地节点
     */
    private async processSingleNode(
        solidNodeUrl: string,
        fullNodeResult: number | null,
        state: {
            failed: boolean;
            failureStartTime: number;
            consecutiveFailures: number;
            lastSuccessTime: number;
            isSuppressed: boolean;
            suppressionStartTime: number;
            lastAlertTime: number;
        },
        now: number,
        blockDiffThreshold: number,
        alertChatId: string,
        FAILURE_THRESHOLD: number,
        PERSISTENT_ALERT_INTERVAL: number,
        SUPPRESSION_THRESHOLD: number
    ): Promise<void> {
        // 请求本地节点
        const localBlockNumber = await this.tronService.getNodeBlockNumber(solidNodeUrl).catch(err => {
            this.logger.error(`节点${solidNodeUrl}请求失败: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        });

        // 如果全节点或本地节点请求失败
        if (fullNodeResult === null || localBlockNumber === null) {
            // 处理节点失败逻辑
            state.consecutiveFailures++;
            const timeSinceLastSuccess = now - state.lastSuccessTime;
            
            this.logger.error(`节点${solidNodeUrl}检查失败 (${state.consecutiveFailures}次)`);
            
            // 标记节点失败
            if (!state.failed) {
                state.failed = true;
                state.failureStartTime = now;
            }
            
            // 如果失败时间超过1分钟
            if (timeSinceLastSuccess >= FAILURE_THRESHOLD) {
                await this.handleNodeFailure(
                    solidNodeUrl,
                    state,
                    now,
                    timeSinceLastSuccess,
                    alertChatId,
                    FAILURE_THRESHOLD,
                    PERSISTENT_ALERT_INTERVAL,
                    SUPPRESSION_THRESHOLD,
                    fullNodeResult
                );
            }
            return;
        }

        // 节点请求成功
        const latestBlockNumber = fullNodeResult;
        const diff = Math.abs(latestBlockNumber - localBlockNumber);

        // 只在差异超过阈值的一半时打印日志，减少日志输出
        if (diff > blockDiffThreshold / 2) {
            this.logger.log(`节点${solidNodeUrl} 区块高度检查 - 全节点: ${latestBlockNumber}, 本地节点: ${localBlockNumber}, 差异: ${diff}, 阈值: ${blockDiffThreshold}`);
        }
        
        // 检查节点是否从失败中恢复
        if (state.failed) {
            const failureDuration = Math.floor((now - state.failureStartTime) / 1000);
            if (failureDuration >= 60) {
                const recoveryMessage = `✅ 节点${solidNodeUrl}连接已恢复正常\n\n` +
                    `节点地址: ${solidNodeUrl}\n` +
                    `最后成功时间: ${new Date(state.lastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                    `故障时长: ${failureDuration} 秒\n` +
                    `当前区块高度: ${localBlockNumber}\n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                    `系统已恢复正常的区块监控。`;

                await this.sendMessageToUser(alertChatId, recoveryMessage);
                this.logger.log(`节点${solidNodeUrl}连接已恢复，故障时长: ${failureDuration}秒`);
            }
            // 重置失败状态
            state.failed = false;
            state.failureStartTime = 0;
            state.consecutiveFailures = 0;
            state.isSuppressed = false;
            state.suppressionStartTime = 0;
            state.lastAlertTime = 0;
        }
        
        // 更新节点成功时间
        state.lastSuccessTime = Date.now();

        // 检查节点的区块高度差异
        if (diff > blockDiffThreshold) {
            this.logger.warn(`节点${solidNodeUrl} 区块高度差异过大: ${diff} (阈值: ${blockDiffThreshold})`);
            await this.handleBlockDiffAlert(
                `节点${solidNodeUrl}`,
                solidNodeUrl,
                latestBlockNumber,
                localBlockNumber,
                diff,
                blockDiffThreshold,
                alertChatId,
                now,
                state.isSuppressed,
                state.suppressionStartTime,
                PERSISTENT_ALERT_INTERVAL,
                SUPPRESSION_THRESHOLD,
                (suppressed, startTime) => {
                    state.isSuppressed = suppressed;
                    state.suppressionStartTime = startTime;
                }
            );
        }
    }

    /**
     * 处理节点失败逻辑
     */
    private async handleNodeFailure(
        solidNodeUrl: string,
        state: {
            failed: boolean;
            failureStartTime: number;
            consecutiveFailures: number;
            lastSuccessTime: number;
            isSuppressed: boolean;
            suppressionStartTime: number;
            lastAlertTime: number;
        },
        now: number,
        timeSinceLastSuccess: number,
        alertChatId: string,
        FAILURE_THRESHOLD: number,
        PERSISTENT_ALERT_INTERVAL: number,
        SUPPRESSION_THRESHOLD: number,
        fullNodeResult: number | null
    ): Promise<void> {
        // 检查是否需要进入告警抑制状态
        if (!state.isSuppressed) {
            // 如果还没有进入抑制状态，检查是否已经持续告警超过30分钟
            if (state.suppressionStartTime === 0) {
                // 记录首次超阈值时间
                state.suppressionStartTime = now;
            } else if (now - state.suppressionStartTime >= SUPPRESSION_THRESHOLD) {
                // 持续超阈值超过30分钟，进入告警抑制状态
                state.isSuppressed = true;
                this.logger.warn(`节点${solidNodeUrl} 连接持续失败超过30分钟，进入告警抑制状态`);

                // 发送告警抑制通知
                const suppressionMessage = `⚠️ 节点${solidNodeUrl} 连接持续失败超过30分钟，暂时停止发送告警\n\n` +
                    `节点地址: ${solidNodeUrl}\n` +
                    `失败时长: ${Math.floor(timeSinceLastSuccess / 1000)} 秒\n` +
                    `连续失败次数: ${state.consecutiveFailures}\n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                    `系统将在连接恢复正常后重新发送通知。`;

                await this.sendMessageToUser(alertChatId, suppressionMessage);
            } else {
                // 在30分钟内，正常发送告警（受10分钟冷却时间控制）
                if (now - state.lastAlertTime >= PERSISTENT_ALERT_INTERVAL) {
                    const failureDuration = Math.floor(timeSinceLastSuccess / 1000);
                    
                    // 获取全节点区块号用于告警信息
                    const fullNodeBlockInfo = fullNodeResult !== null ? `${fullNodeResult}` : '未知';
                    
                    const message = `🚨 节点${solidNodeUrl}连接持续失败告警\n\n` +
                        `节点地址: ${solidNodeUrl}\n` +
                        `失败时长: ${failureDuration} 秒\n` +
                        `连续失败次数: ${state.consecutiveFailures}\n` +
                        `最后成功时间: ${new Date(state.lastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                        `当前时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                        `全节点区块号: ${fullNodeBlockInfo}\n\n` +
                        `请检查节点连接是否正常！`;

                    await this.sendMessageToUser(alertChatId, message);
                    state.lastAlertTime = now;
                    this.logger.error(`已发送节点${solidNodeUrl}持续失败告警，失败时长: ${failureDuration}秒`);
                }
            }
        }
        // 如果已经在告警抑制状态，则不发送任何告警
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
        now: number,
        isSuppressed: boolean,
        suppressionStartTime: number,
        persistentAlertInterval: number,
        suppressionThreshold: number,
        updateState: (suppressed: boolean, startTime: number) => void
    ): Promise<void> {
        // 每次检测到区块高度差异超过阈值时打印日志
        this.logger.warn(`${nodeName} 区块高度差异超过阈值 - 全节点: ${latestBlockNumber}, 本地节点: ${localBlockNumber}, 差异: ${diff}, 阈值: ${threshold}`);
        
        // 检查是否需要进入告警抑制状态
        if (!isSuppressed) {
            // 如果还没有进入抑制状态，检查是否已经持续告警超过30分钟
            if (suppressionStartTime === 0) {
                // 记录首次超阈值时间
                updateState(false, now);
            } else if (now - suppressionStartTime >= suppressionThreshold) { // 30分钟
                // 持续超阈值超过30分钟，进入告警抑制状态
                updateState(true, suppressionStartTime);
                this.logger.warn(`${nodeName} 区块高度差异持续超过阈值30分钟，进入告警抑制状态`);

                // 发送告警抑制通知
                const suppressionMessage = `⚠️ ${nodeName} 区块高度差异持续超过阈值超过30分钟，暂时停止发送告警\n\n` +
                    `节点地址: ${nodeUrl}\n` +
                    `最新区块: ${latestBlockNumber}\n` +
                    `本地节点: ${localBlockNumber}\n` +
                    `差值: ${diff} (阈值: ${threshold})\n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                    `系统将在区块高度恢复正常后重新发送通知。`;

                await this.sendMessageToUser(alertChatId, suppressionMessage);
            } else {
                // 在30分钟内，正常发送告警（受冷却时间控制）
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

        // 设置机器人菜单命令
        this.setBotCommands(bot);

        bot.on("polling_error", (err) => {
            this.logger.error(`Telegram 网络波动: ${err.message || err}`);
            this.logger.error(`错误详情: ${JSON.stringify(err)}`);
        });
    }

    /**
     * 设置机器人菜单命令
     */
    private async setBotCommands(bot: TelegramBot): Promise<void> {
        try {
            const commands = [
                { command: 'startbot', description: '开启区块监控' },
                { command: 'stopbot', description: '停止区块监控' }
            ];
            
            await bot.setMyCommands(commands);
            this.logger.log('机器人菜单命令已设置');
        } catch (error) {
            this.logger.error('设置机器人菜单命令失败:', error);
        }
    }
}
