import { Injectable } from "@nestjs/common";

@Injectable()
export class TronService {
  // 预留：对接 tronweb / 扫链服务等

  async validateAddress(
    _address: string
  ): Promise<{ valid: boolean; message?: string }> {
    // 简化实现：只做基础格式校验，真正的链上校验可后续接入 tronweb
    return { valid: true };
  }
}
