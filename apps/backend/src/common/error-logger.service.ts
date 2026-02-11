import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, mkdirSync } from "fs";
import { appendFile } from "fs/promises";
import { join } from "path";

/**
 * 错误日志按天写入文件：logs/error-YYYY-MM-DD.log，每行一条 JSON
 */
@Injectable()
export class ErrorLoggerService {
  private readonly logDir: string;

  constructor(private readonly configService: ConfigService) {
    const dir =
      this.configService.get<string>("ERROR_LOG_DIR") ||
      this.configService.get<string>("LOG_DIR") ||
      "logs";
    const cwd = process.cwd();
    const baseDir = /\/apps\/(backend|work)(\/|$)/.test(cwd)
      ? join(cwd, "..", "..")
      : cwd;
    this.logDir = join(baseDir, dir);
  }

  async log(payload: Record<string, unknown>): Promise<void> {
    const dateStr = new Date().toISOString().slice(0, 10);
    const filePath = join(this.logDir, `error-${dateStr}.log`);
    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }
      await appendFile(filePath, JSON.stringify(payload) + "\n", "utf8");
    } catch (err) {
      console.error("[ErrorLoggerService] write failed", filePath, err);
    }
  }
}
