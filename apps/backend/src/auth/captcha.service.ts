import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const svgCaptcha = require('svg-captcha');

interface CaptchaData {
  code: string;
  expiresAt: number;
}

@Injectable()
export class CaptchaService {
  // 内存存储验证码（生产环境建议使用 Redis）
  private captchaStore = new Map<string, CaptchaData>();

  // 验证码过期时间（5分钟）
  private readonly CAPTCHA_EXPIRES_IN = 5 * 60 * 1000;

  /**
   * 生成验证码
   */
  generateCaptcha(): { session: string; captchaImage: string; code: string } {
    // 生成验证码
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      noise: 2, // 干扰线条数量
      color: true, // 验证码字符颜色
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
      fontSize: 50,
      charPreset: '0123456789', // 排除易混淆字符 I,O
      // charPreset: '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', // 排除易混淆字符 I,O
    });

    // 生成唯一ID
    const session = randomBytes(16).toString('hex');

    // 存储验证码（转为大写，不区分大小写）
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const code: string = captcha.text.toUpperCase();
    this.captchaStore.set(session, {
      code,
      expiresAt: Date.now() + this.CAPTCHA_EXPIRES_IN,
    });

    // 定期清理过期的验证码
    this.cleanExpiredCaptchas();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const captchaData = captcha.data as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const captchaText: string = captcha.text;

    return {
      session,
      captchaImage: `data:image/svg+xml;base64,${Buffer.from(captchaData).toString('base64')}`,
      code: captchaText, // 仅用于开发调试，生产环境应删除
    };
  }

  /**
   * 验证验证码
   */
  verifyCaptcha(session: string, code: string): boolean {
    const captchaData = this.captchaStore.get(session);

    if (!captchaData) {
      return false; // 验证码不存在
    }

    // 检查是否过期
    if (Date.now() > captchaData.expiresAt) {
      this.captchaStore.delete(session);
      return false;
    }

    // 验证码验证后删除（一次性使用）
    this.captchaStore.delete(session);

    // 不区分大小写比较
    return captchaData.code === code.toUpperCase();
  }

  /**
   * 清理过期的验证码
   */
  private cleanExpiredCaptchas() {
    const now = Date.now();
    for (const [id, data] of this.captchaStore.entries()) {
      if (now > data.expiresAt) {
        this.captchaStore.delete(id);
      }
    }
  }

  /**
   * 获取存储的验证码数量（用于监控）
   */
  getStoreSize(): number {
    return this.captchaStore.size;
  }
}
