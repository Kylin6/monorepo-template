import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, mkdirSync } from "fs";
import { appendFile } from "fs/promises";
import { join } from "path";
import { IOperationLogger } from "@common/index";

/**
 * 操作日志按天写入文件：logs/operation-YYYY-MM-DD.log，每行一条 JSON
 * 使用异步写入，不阻塞请求处理
 */
@Injectable()
export class OperationLoggerService implements IOperationLogger {
  private readonly logDir: string;
  private loggedPathOnce = false;

  constructor(private readonly configService: ConfigService) {
    const dir =
      this.configService.get<string>("OPERATION_LOG_DIR") ||
      this.configService.get<string>("LOG_DIR") ||
      "logs";
    const cwd = process.cwd();
    const baseDir = /\/apps\/(backend|work)(\/|$)/.test(cwd)
      ? join(cwd, "..", "..")
      : cwd;
    this.logDir = join(baseDir, dir);
  }

  async log(payload: Record<string, unknown>): Promise<void> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10);
    const fileName = `operation-${dateStr}.log`;
    const filePath = join(this.logDir, fileName);

    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }
      const line = JSON.stringify(payload) + "\n";
      await appendFile(filePath, line, "utf8");
      if (!this.loggedPathOnce) {
        this.loggedPathOnce = true;
        console.log("[OperationLoggerService] 操作日志写入目录:", this.logDir);
      }
    } catch (err) {
      console.error("[OperationLoggerService] write failed", filePath, err);
    }
  }
}
