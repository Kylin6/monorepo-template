import { Request } from 'express';

/**
 * 代理用户信息
 */
export interface AgentInfo {
  uid: number;
  username: string | null;
  nickname: string | null;
}

/**
 * 扩展的请求对象，包含代理信息
 */
export interface RequestWithAgent extends Request {
  agent: AgentInfo;
}
