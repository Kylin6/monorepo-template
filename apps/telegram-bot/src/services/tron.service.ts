import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);

  async validateAddress(
    _address: string
  ): Promise<{ valid: boolean; message?: string }> {
    return { valid: true };
  }

  async getLatestBlockNumber(nodeUrl: string): Promise<number> {
    try {
      const response = await fetch(`${nodeUrl}/wallet/getnowblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.block_header?.raw_data?.number ?? 0;
    } catch (error) {
      this.logger.error(`获取最新区块失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getNodeBlockNumber(nodeUrl: string): Promise<number> {
    return this.getLatestBlockNumber(nodeUrl);
  }
}
