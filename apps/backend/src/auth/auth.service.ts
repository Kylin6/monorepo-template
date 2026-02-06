import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { randomBytes, createHmac } from "crypto";
import * as bcrypt from "bcryptjs";
import { AdminUser, getAdminUserRepository } from "@database/index";
import { LoginDto } from "./dto/login.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { CaptchaService } from "./captcha.service";
import { TwoStepVerifyDto } from "./dto/two-step-verify.dto";

const TWO_STEP_TOKEN_TTL = 5 * 60; // 5 minutes
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

@Injectable()
export class AuthService {
  private readonly twoStepSessions = new Map<
    string,
    { userId: number; expiresAt: number }
  >();

  private omitAdminUserSensitive(adminUser: AdminUser): {
    uid: number;
    twoStepValidate: number | null;
  } {
    return {
      uid: adminUser.id,
      twoStepValidate: adminUser.twoStepValidate ?? null,
    };
  }

  constructor(private captchaService: CaptchaService) {}

  private async adminUserRepository() {
    return getAdminUserRepository();
  }

  async findAdminUserByAccessToken(token: string): Promise<AdminUser | null> {
    if (!token) return null;
    const repo = await this.adminUserRepository();
    return repo.findOne({ where: { accessToken: token } });
  }

  async findAdminUserById(id: number): Promise<AdminUser | null> {
    const repo = await this.adminUserRepository();
    return repo.findOne({ where: { id } });
  }

  private async issueAccessToken(adminUser: AdminUser): Promise<string> {
    const currentTime = Math.floor(Date.now() / 1000);
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    const isTokenValid =
      adminUser.accessToken &&
      adminUser.lastLoginAt &&
      currentTime < (adminUser.lastLoginAt || 0) &&
      (adminUser.accessTokenExpired === 0 ||
        currentTime < (adminUser.accessTokenExpired || 0));

    const repo = await this.adminUserRepository();

    if (isTokenValid && adminUser.accessToken) {
      await repo.update(
        { id: adminUser.id },
        {
          lastLoginAt: currentTime + sevenDaysInSeconds,
          accessTokenExpired: currentTime + sevenDaysInSeconds,
        }
      );
      return adminUser.accessToken;
    }

    const newToken = randomBytes(16).toString("hex");
    await repo.update(
      { id: adminUser.id },
      {
        accessToken: newToken,
        lastLoginAt: currentTime + sevenDaysInSeconds,
        accessTokenExpired: currentTime + sevenDaysInSeconds,
      }
    );
    return newToken;
  }

  private createTwoStepSession(userId: number): {
    token: string;
    expiresAt: number;
  } {
    this.cleanupExpiredTwoStepSessions();
    const token = randomBytes(16).toString("hex");
    const expiresAt = Math.floor(Date.now() / 1000) + TWO_STEP_TOKEN_TTL;
    this.twoStepSessions.set(token, { userId, expiresAt });
    return { token, expiresAt };
  }

  private cleanupExpiredTwoStepSessions(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [token, meta] of this.twoStepSessions.entries()) {
      if (meta.expiresAt <= now) {
        this.twoStepSessions.delete(token);
      }
    }
  }

  private decodeBase32(secret: string): Buffer {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const normalized = secret
      .replace(/=+$/, "")
      .replace(/\s+/g, "")
      .toUpperCase();
    if (!normalized) {
      throw new Error("Secret is empty");
    }

    let bits = "";
    for (const char of normalized) {
      const val = alphabet.indexOf(char);
      if (val === -1) {
        throw new Error(`Invalid base32 character: ${char}`);
      }
      bits += val.toString(2).padStart(5, "0");
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }

    return Buffer.from(bytes);
  }

  private generateTotp(key: Buffer, counter: number): string {
    const buffer = Buffer.alloc(8);
    const safeCounter = Math.max(counter, 0);
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(safeCounter, 4);

    const hmac = createHmac("sha1", key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const otp = binary % 10 ** TOTP_DIGITS;
    return otp.toString().padStart(TOTP_DIGITS, "0");
  }

  verifyGoogleAuthCode(secret: string, token: string): boolean {
    if (!secret || !token) {
      return false;
    }

    const sanitizedToken = token.trim();
    if (!/^\d{6}$/.test(sanitizedToken)) {
      return false;
    }

    try {
      const key = this.decodeBase32(secret);
      const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

      for (let windowOffset = -1; windowOffset <= 1; windowOffset++) {
        const counter = currentCounter + windowOffset;
        if (counter < 0) continue;
        const generated = this.generateTotp(key, counter);
        if (generated === sanitizedToken) {
          return true;
        }
      }
    } catch {
      return false;
    }

    return false;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { username, password, session, captcha } = loginDto;

    if (!username || !password) {
      throw new UnauthorizedException("用户名或密码不能为空");
    }

    // 验证验证码
    if (!session || !captcha) {
      throw new BadRequestException("验证码不能为空");
    }

    const isCaptchaValid = this.captchaService.verifyCaptcha(session, captcha);
    if (!isCaptchaValid) {
      throw new BadRequestException("验证码错误或已过期");
    }

    // 查找管理员用户
    const repo = await this.adminUserRepository();
    const adminUser = await repo.findOne({
      where: { username },
    });
    if (!adminUser) {
      throw new UnauthorizedException("用户不存在");
    }

    // 验证密码（客户端传明文，数据库为hash）
    const ok = await bcrypt.compare(password, adminUser.passwordHash || "");
    if (!ok) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    if (adminUser.twoStepValidate === 10) {
      const { token, expiresAt } = this.createTwoStepSession(adminUser.id);
      return {
        twoStepRequired: true,
        temp_token: token,
        temp_token_expires_at: expiresAt,
      };
    }

    const access_token = await this.issueAccessToken(adminUser);
    const adminUserSafe = this.omitAdminUserSensitive(adminUser);

    return {
      access_token,
      ...adminUserSafe,
    };
  }

  async verifyTwoStepLogin(
    verifyDto: TwoStepVerifyDto
  ): Promise<AuthResponseDto> {
    const { tempToken, googleAuthCode } = verifyDto;
    this.cleanupExpiredTwoStepSessions();

    const session = this.twoStepSessions.get(tempToken);
    if (!session) {
      throw new UnauthorizedException("临时令牌无效或已过期");
    }

    const repo = await this.adminUserRepository();
    const adminUser = await repo.findOne({
      where: { id: session.userId },
    });
    if (!adminUser) {
      this.twoStepSessions.delete(tempToken);
      throw new UnauthorizedException("用户不存在");
    }

    if (!adminUser.googleSecret) {
      this.twoStepSessions.delete(tempToken);
      throw new BadRequestException("该账号未配置二次认证密钥");
    }

    const isCodeValid = this.verifyGoogleAuthCode(
      adminUser.googleSecret,
      googleAuthCode
    );

    if (!isCodeValid) {
      throw new UnauthorizedException("动态验证码错误");
    }

    this.twoStepSessions.delete(tempToken);

    const access_token = await this.issueAccessToken(adminUser);
    const adminUserSafe = this.omitAdminUserSensitive(adminUser);

    return {
      access_token,
      ...adminUserSafe,
    };
  }
}
