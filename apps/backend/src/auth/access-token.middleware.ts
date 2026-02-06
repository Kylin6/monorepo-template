import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AccessTokenMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // 支持从 Authorization: Bearer <token> 或 X-Access-Token 读取
    const authHeader = req.headers['authorization'] || '';
    const headerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;
    const xAccessToken = req.headers['x-access-token'] as string | undefined;
    const token = headerToken || xAccessToken;

    if (!token) {
      throw new UnauthorizedException('未提供 token');
    }

    const adminUser = await this.authService.findAdminUserByAccessToken(token);
    if (!adminUser || adminUser.status !== 10) {
      throw new UnauthorizedException('无效或已禁用的 token');
    }

    // 检查token是否过期（基于lastLoginAt 或 accessTokenExpired）
    const currentTime = Math.floor(Date.now() / 1000);
    if (
      (adminUser.lastLoginAt && currentTime >= adminUser.lastLoginAt) ||
      (adminUser.accessTokenExpired > 0 &&
        currentTime >= adminUser.accessTokenExpired)
    ) {
      throw new UnauthorizedException('token 已过期，请重新登录');
    }

    // 挂载到请求对象，后续控制器可直接使用 req.adminUser
    (req as unknown as { adminUser: unknown }).adminUser = {
      id: adminUser.id,
      username: adminUser.username,
    };
    next();
  }
}
