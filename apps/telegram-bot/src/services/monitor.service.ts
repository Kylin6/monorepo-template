import { Injectable, Logger } from "@nestjs/common";

/**
 * 区块监控服务
 * 负责管理区块监控的开启和关闭状态
 */
@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);
  private isMonitoringEnabled: boolean = true; // 默认开启监控

  /**
   * 开启区块监控
   */
  enableMonitoring(): void {
    if (this.isMonitoringEnabled) {
      this.logger.warn('区块监控已开启，无需重复开启');
      return;
    }
    
    this.isMonitoringEnabled = true;
    this.logger.log('区块监控已开启');
  }

  /**
   * 关闭区块监控
   */
  disableMonitoring(): void {
    if (!this.isMonitoringEnabled) {
      this.logger.warn('区块监控已关闭，无需重复关闭');
      return;
    }
    
    this.isMonitoringEnabled = false;
    this.logger.log('区块监控已关闭');
  }

  /**
   * 获取监控状态
   */
  isMonitoringActive(): boolean {
    return this.isMonitoringEnabled;
  }
}
