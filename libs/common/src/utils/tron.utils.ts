import * as fs from "fs";
import * as path from "path";
import TronWeb from "tronweb";

/**
 * Tron 钱包工具类
 */
export class TronUtils {
  // 验证TRX地址格式
  static isValidAddress(address: string): boolean {
    return TronWeb.utils.address.isAddress(address);
  }

  /**
   * 查找项目根目录（包含 package.json 且包含 apps/libs 目录的目录）
   * @returns 项目根目录路径，如果找不到则返回 null
   */
  private static findProjectRoot(): string | null {
    const startDirs = Array.from(
      new Set([process.cwd(), __dirname].map((d) => path.resolve(d))),
    );

    for (const startDir of startDirs) {
      let currentDir = startDir;

      while (currentDir !== path.dirname(currentDir)) {
        const packageJson = path.join(currentDir, "package.json");

        if (fs.existsSync(packageJson)) {
          // 检查是否是 monorepo 根目录（包含 apps/libs 目录）
          const hasApps = fs.existsSync(path.join(currentDir, "apps"));
          const hasLibs = fs.existsSync(path.join(currentDir, "libs"));
          if (hasApps || hasLibs) {
            return currentDir;
          }
        }
        currentDir = path.dirname(currentDir);
      }
    }

    return null;
  }

  /**
   * 获取钱包文件保存目录
   * @param saveDir 用户指定的保存目录
   * @returns 保存目录路径
   */
  private static getWalletSaveDir(saveDir?: string): string {
    if (saveDir) {
      return saveDir;
    }

    // 尝试查找项目根目录
    const rootDir = this.findProjectRoot();

    // 如果找到根目录，使用根目录下的 wallets；否则使用当前目录
    return rootDir
      ? path.join(rootDir, "wallets")
      : path.join(process.cwd(), "wallets");
  }

  /**
   * 创建 Tron 钱包
   * 生成一个新的钱包，返回 base58 格式的地址，并将私钥保存到文件中
   * @param saveDir 保存私钥文件的目录路径，默认为当前目录下的 'wallets' 文件夹
   * @returns 返回钱包地址（base58 格式）
   * @throws 如果创建钱包或保存文件失败，会抛出错误
   */
  static createWallet(saveDir?: string): string {
    try {
      // 创建钱包账户
      const account = TronWeb.utils.accounts.generateAccount();

      // 获取私钥和地址
      const privateKey = account.privateKey;
      const address = account.address.base58;

      // 确定保存目录（自动查找项目根目录）
      const targetDir = this.getWalletSaveDir(saveDir);

      // 确保目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 构建文件路径（以地址为文件名）
      const filePath = path.join(targetDir, `${address}.txt`);

      // 将私钥写入文件
      fs.writeFileSync(filePath, privateKey, "utf8");

      // 返回地址和文件路径信息（便于调试）
      console.log(`钱包已创建: ${address}`);
      console.log(`私钥文件已保存到: ${filePath}`);

      return address;
    } catch (error) {
      throw new Error(
        `创建 Tron 钱包失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      );
    }
  }

  /**
   * 从私钥文件读取私钥
   * @param address 钱包地址（用作文件名）
   * @param saveDir 私钥文件所在的目录路径，默认为当前目录下的 'wallets' 文件夹
   * @returns 私钥字符串
   * @throws 如果文件不存在或读取失败，会抛出错误
   */
  static readPrivateKeyFromFile(address: string, saveDir?: string): string {
    try {
      // 确定保存目录（与 createWallet 使用相同的逻辑）
      const targetDir = this.getWalletSaveDir(saveDir);
      const filePath = path.join(targetDir, `${address}.txt`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`私钥文件不存在: ${filePath}`);
      }

      const privateKey = fs.readFileSync(filePath, "utf8").trim();
      return privateKey;
    } catch (error) {
      throw new Error(
        `读取私钥失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  }

  /**
   * 计算代理值 - 速冲
   * @param total 总数量
   * @param add 增加数量
   * @param remain 剩余数量
   * @returns 代理值
   */
  static calculateProxyValue(
    total: number,
    add: number,
    remain: number,
  ): number {
    const proxyValue = (total * add) / (total - add - remain);
    return Math.floor(proxyValue);
  }
}
