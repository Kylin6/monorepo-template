import type { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { Web3 } from "web3";

function resolveRepoKeystorePath(): string | undefined {
  // 目标固定为仓库根目录的 ./keystore/keystore.json
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, "keystore", "keystore1.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/**
 * 统一获取 Tron 私钥的入口
 *
 * 当前实现：
 * - 优先从 ConfigService("TRON_PRIVATE_KEY") 读取
 * - 其次回退到 process.env.TRON_PRIVATE_KEY
 * - 返回去掉首尾空格的字符串；若都不存在则返回 undefined
 */
export async function getTronPrivateKey(
  config: ConfigService
): Promise<string | undefined> {
  // 1. 尝试使用 Keystore
  const keystorePath = resolveRepoKeystorePath();
  const keystorePassword = config.get<string>("TRON_KEYSTORE_PASSWORD");

  if (keystorePath && keystorePassword) {
    try {
      const keystoreRaw = fs.readFileSync(keystorePath, "utf8");
      const keystoreJson = JSON.parse(keystoreRaw);

      const web3 = new Web3();
      // ethers 生成的 keystore 常用字段名为 "Crypto"（大写），而 web3 通常期望 "crypto"（小写）
      if (keystoreJson?.Crypto && !keystoreJson?.crypto) {
        keystoreJson.crypto = keystoreJson.Crypto;
      }
      const account = await web3.eth.accounts.decrypt(
        keystoreJson,
        keystorePassword.trim()
      );

      // account.privateKey: "0x...."
      const privateKeyHex = (account as any).privateKey as string;
      const privateKey = privateKeyHex.startsWith("0x")
        ? privateKeyHex.slice(2)
        : privateKeyHex;
        
      if (privateKey && privateKey.trim()) {
        return privateKey.trim();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Tron keystore 解密失败:", (e as Error)?.message ?? e);
      // 解密失败时暂不抛错，继续走后续回退逻辑
    }
  }

  // 2. 兼容旧逻辑：回退到 TRON_PRIVATE_KEY
  const fromConfig = config.get<string>("TRON_PRIVATE_KEY");
  if (fromConfig && fromConfig.trim()) {
    return fromConfig.trim();
  }

  const fromEnv = process.env.TRON_PRIVATE_KEY;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }

  return undefined;
}
