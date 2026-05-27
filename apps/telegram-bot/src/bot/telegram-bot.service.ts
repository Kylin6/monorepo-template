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
        const solidNodesStr = this.configService.get<string>('TRON_SOLID_NODES');
        
        // 检查 TRON_SOLID_NODES 是否配置
        if (!solidNodesStr || solidNodesStr.trim() === '') {
            this.logger.error('TRON_SOLID_NODES 未配置，区块监控任务无法启动');
            // 发送告警消息
            const alertChatId = this.configService.get<string>('BLOCK_ALERT_CHAT_ID');
            if (alertChatId && this.bot) {
                const errorMessage = `🚨 配置错误：监控节点地址未配置\n\n` +
                    `环境变量 TRON_SOLID_NODES 未设置或为空\n\n` +
                    `请在 .env 文件中配置监控节点地址\n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
                
                this.sendMessageToUser(alertChatId, errorMessage).catch(err => {
                    this.logger.error('发送配置错误告警失败:', err);
                });
            }
            return;
        }
        
        const solidNodes = solidNodesStr.split(',').map(url => url.trim()).filter(url => url.length > 0);
        
        if (solidNodes.length === 0) {
            this.logger.error('TRON_SOLID_NODES 格式错误，区块监控任务无法启动');
            // 发送告警消息
            const alertChatId = this.configService.get<string>('BLOCK_ALERT_CHAT_ID');
            if (alertChatId && this.bot) {
                const errorMessage = `🚨 配置错误：监控节点地址格式错误\n\n` +
                    `环境变量 TRON_SOLID_NODES 的值格式不正确\n` +
                    `当前值: ${solidNodesStr}\n\n` +
                    `请使用逗号分隔多个节点地址，例如：\n` +
                    `TRON_SOLID_NODES=http://66.29.147.102:43921,http://66.29.147.112:43921\n\n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
                
                this.sendMessageToUser(alertChatId, errorMessage).catch(err => {
                    this.logger.error('发送配置错误告警失败:', err);
                });
            }
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
            hasSentFailureAlert: false,  // 标记是否发送过失败告警
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
            hasSentFailureAlert: boolean;  // 标记是否发送过失败告警
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

        // 如果本地节点请求失败
        if (localBlockNumber === null) {
            // 处理节点失败逻辑
            state.consecutiveFailures++;
            const timeSinceLastSuccess = now - state.lastSuccessTime;
            
            this.logger.error(`节点${solidNodeUrl}检查失败 (${state.consecutiveFailures}次)`);
            
            // 标记节点失败（只在首次失败时记录开始时间）
            if (!state.failed) {
                state.failed = true;
                state.failureStartTime = now;
                this.logger.log(`节点${solidNodeUrl}首次检测到失败，记录失败开始时间`);
            } else {
                this.logger.log(`节点${solidNodeUrl}持续失败，当前连续失败次数: ${state.consecutiveFailures}`);
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
        
        // 如果全节点请求失败，但本地节点成功，跳过本次检查
        if (fullNodeResult === null) {
            this.logger.warn(`全节点请求失败，跳过节点${solidNodeUrl}的区块高度差异检查`);
            return;
        }

        // 节点请求成功
        const latestBlockNumber = fullNodeResult;
        const diff = latestBlockNumber - localBlockNumber;  // 不使用绝对值，保留正负号

        // 每次都打印区块高度检查日志
        // this.logger.log(`节点${solidNodeUrl} 区块高度检查 - 全节点: ${latestBlockNumber}, 本地节点: ${localBlockNumber}, 差异: ${diff}, 阈值: ${blockDiffThreshold}`);
        
        // 检查节点是否从失败中恢复
        if (state.failed) {
            const failureDuration = Math.floor((now - state.failureStartTime) / 1000);
            this.logger.log(`节点${solidNodeUrl}检测到恢复 - failureStartTime: ${new Date(state.failureStartTime).toLocaleString()}, failureDuration: ${failureDuration}秒`);
            
            // 只在故障时长 >= 60秒 且 发送过失败告警时才发送恢复通知
            if (failureDuration >= 60 && state.hasSentFailureAlert) {
                const recoveryMessage = `✅ 节点${solidNodeUrl}连接已恢复正常\n\n` +
                    `节点地址: ${solidNodeUrl}\n` +
                    `最后成功时间: ${new Date(state.lastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                    `故障时长: ${failureDuration} 秒\n` +
                    `当前区块高度: ${localBlockNumber}\n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n` +
                    `系统已恢复正常的区块监控。`;

                await this.sendMessageToUser(alertChatId, recoveryMessage);
                this.logger.log(`节点${solidNodeUrl}连接已恢复，故障时长: ${failureDuration}秒`);
                
                // 立即重置失败状态，避免重复发送恢复通知
                state.failed = false;
                state.failureStartTime = 0;
                state.consecutiveFailures = 0;
                state.isSuppressed = false;
                state.suppressionStartTime = 0;
                state.lastAlertTime = 0;
                state.hasSentFailureAlert = false;
                
                // 更新节点成功时间（在重置后立即更新）
                state.lastSuccessTime = now;
                return;  // 提前返回，避免后面再次更新 lastSuccessTime
            } else if (failureDuration >= 60 && !state.hasSentFailureAlert) {
                this.logger.log(`节点${solidNodeUrl}故障时长达到60秒，但未发送过失败告警，跳过恢复通知`);
                
                // 重置失败状态
                state.failed = false;
                state.failureStartTime = 0;
                state.consecutiveFailures = 0;
                state.isSuppressed = false;
                state.suppressionStartTime = 0;
                state.lastAlertTime = 0;
                state.hasSentFailureAlert = false;
                state.lastSuccessTime = now;
                return;
            }
        }
        
        // 更新节点成功时间（只有在没有发送恢复通知时才执行）
        state.lastSuccessTime = Date.now();

        // 检查节点的区块高度差异
        // 只有当全节点高度 > 本地节点高度时才告警（本地节点落后）
        if (latestBlockNumber > localBlockNumber && diff > blockDiffThreshold) {
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
                state,
                PERSISTENT_ALERT_INTERVAL,
                SUPPRESSION_THRESHOLD
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
            hasSentFailureAlert: boolean;  // 标记是否发送过失败告警
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
                // 首次检测到失败，记录开始时间
                state.suppressionStartTime = now;
                this.logger.log(`节点${solidNodeUrl}首次检测到失败，开始监控`);
                
                // 检查失败时长是否已经达到60秒，如果是则立即发送告警
                const failureDuration = Math.floor(timeSinceLastSuccess / 1000);
                if (failureDuration >= FAILURE_THRESHOLD / 1000) {
                    const fullNodeBlockInfo = fullNodeResult !== null ? `${fullNodeResult}` : '未知';
                    
                    const message = `🚨 节点${solidNodeUrl}连接失败告警\n\n` +
                        `节点地址: ${solidNodeUrl}\n` +
                        `失败时长: ${failureDuration} 秒\n` +
                        `连续失败次数: ${state.consecutiveFailures}\n` +
                        `最后成功时间: ${new Date(state.lastSuccessTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                        `当前时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n` +
                        `全节点区块号: ${fullNodeBlockInfo}\n\n` +
                        `请检查节点连接是否正常！`;

                    await this.sendMessageToUser(alertChatId, message);
                    state.lastAlertTime = now;
                    state.hasSentFailureAlert = true;  // 标记已发送过失败告警
                    this.logger.error(`已发送节点${solidNodeUrl}首次失败告警，失败时长: ${failureDuration}秒`);
                }
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
                    state.hasSentFailureAlert = true;  // 标记已发送过失败告警
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
        state: {
            isSuppressed: boolean;
            suppressionStartTime: number;
            lastAlertTime: number;
        },
        persistentAlertInterval: number,
        suppressionThreshold: number
    ): Promise<void> {
        // 每次检测到区块高度差异超过阈值时打印日志
        this.logger.warn(`${nodeName} 区块高度差异超过阈值 - 全节点: ${latestBlockNumber}, 本地节点: ${localBlockNumber}, 差异: ${diff}, 阈值: ${threshold}`);
        
        // 检查是否需要进入告警抑制状态
        if (!state.isSuppressed) {
            // 安全检查：如果 suppressionStartTime 是很久以前的时间（超过1小时），重置它
            const ONE_HOUR = 60 * 60 * 1000;
            if (state.suppressionStartTime > 0 && (now - state.suppressionStartTime) > ONE_HOUR) {
                this.logger.warn(`${nodeName} 检测到异常的抑制开始时间，重置状态`);
                state.suppressionStartTime = 0;
                state.lastAlertTime = 0;
            }
                    
            // 如果还没有进入抑制状态，检查是否已经持续告警超过30分钟
            if (state.suppressionStartTime === 0) {
                // 首次检测到超阈值，记录开始时间并立即发送告警
                state.suppressionStartTime = now;
                const message = `⚠️ ${nodeName} 区块高度异常告警\n\n` +
                    `节点地址: ${nodeUrl}\n` +
                    `最新区块: ${latestBlockNumber}\n` +
                    `本地节点: ${localBlockNumber}\n` +
                    `差值: ${diff} \n` +
                    `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
        
                await this.sendMessageToUser(alertChatId, message);
                state.lastAlertTime = now;
                this.logger.warn(`${nodeName} 区块高度差异过大: ${diff}, 已发送首次告警`);
            } else if (now - state.suppressionStartTime >= suppressionThreshold) { // 30分钟
                // 持续超阈值超过30分钟，进入告警抑制状态
                state.isSuppressed = true;
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
                if (now - state.lastAlertTime >= persistentAlertInterval) {
                    const message = `⚠️ ${nodeName} 区块高度异常告警\n\n` +
                        `节点地址: ${nodeUrl}\n` +
                        `最新区块: ${latestBlockNumber}\n` +
                        `本地节点: ${localBlockNumber}\n` +
                        `差值: ${diff} \n` +
                        `时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
        
                    await this.sendMessageToUser(alertChatId, message);
                    state.lastAlertTime = now;
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
