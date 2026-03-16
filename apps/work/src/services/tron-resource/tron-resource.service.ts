import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TronWeb } from "tronweb";
import { TronUtils } from "@common/index";
import { getTronPrivateKey } from "./get-private-key.helper";

/** 资源类型：带宽 或 能量 */
export type TronResourceType = "BANDWIDTH" | "ENERGY";

/** 派发资源参数 */
export interface DelegateResourceOptions {
  /** 接收方地址（base58 或 hex） */
  receiverAddress: string;
  /** 资源类型 */
  resource: TronResourceType;
  /** 数量（单位：sun，1 TRX = 1e6 sun） */
  amountSun: number;
  /** 是否锁定（锁定后 3 天内不可回收），默认 false */
  lock?: boolean;
  /** 锁定时长（区块数），lock 为 true 时有效 */
  lockPeriod?: number;
  /** 发起方地址 */
  ownerAddress: string;
  /** 权限 ID */
  permissionId?: number;
}

/** 回收资源参数 */
export interface UndelegateResourceOptions {
  /** 接收方地址（即当时派发给的地址） */
  receiverAddress: string;
  /** 资源类型 */
  resource: TronResourceType;
  /** 回收数量（单位：sun） */
  amountSun: number;
  /** 发起方地址 */
  ownerAddress: string;
  /** 权限 ID */
  permissionId?: number;
}

export interface TransferTrxOptions {
  fromAddress: string;
  toAddress: string;
  /** 单位：sun */
  amountSun: number;
  permissionId?: number;
}

/**
 * Tron 资源服务：处理资源派发（委托）与回收（解除委托）
 * - 派发：将已质押的带宽/能量委托给目标地址使用
 * - 回收：从目标地址收回已委托的带宽/能量
 */
@Injectable()
export class TronResourceService implements OnModuleInit {
  private readonly logger = new Logger(TronResourceService.name);
  private tronWeb: TronWeb | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const fullNode = this.config.get<string>(
      "TRON_NODE_URL",
      "https://api.trongrid.io"
    );
    const privateKey = await getTronPrivateKey(this.config);
    if (!privateKey) {
      this.logger.warn(
        "Tron 私钥未获取到，请检查 TRON_KEYSTORE_PASSWORD 或 TRON_PRIVATE_KEY 配置"
      );
      return;
    }
    this.tronWeb = new TronWeb({
      fullHost: fullNode,
      privateKey,
    });
    this.logger.log(`TronResourceService 已初始化，节点: ${fullNode}`);
  }

  /**
   * 查询地址资源信息（对标 PHP: /wallet/getaccountresource）
   * 主要用于提前回收逻辑：根据 Energy/Net 剩余判断是否需要回收。
   *
   * - 不要求配置私钥；未初始化时会临时创建只读 TronWeb 实例。
   */
  async getAccountResource(address: string): Promise<Record<string, any>> {
    const fullNode = this.config.get<string>(
      "TRON_NODE_URL",
      "https://api.trongrid.io"
    );
    const tronWeb = this.tronWeb ?? new TronWeb({ fullHost: fullNode });
    if (!address) throw new Error("address 不能为空");
    return (await tronWeb.trx.getAccountResources(address)) as any;
  }

  /**
   * 查询交易手续费/资源消耗信息（对标 PHP: /wallet/gettransactioninfobyid）
   * - 不要求配置私钥；未初始化时会临时创建只读 TronWeb 实例。
   */
  async getTransactionInfoById(txId: string): Promise<Record<string, any>> {
    // const fullNode = this.config.get<string>(
    //   "TRON_NODE_URL",
    //   "https://api.trongrid.io"
    // );
    const fullNode = "https://api.trongrid.io";
    // ⚠️ 不要复用 this.tronWeb（可能是 lite fullnode），这里强制使用可用的 fullnode
    const tronWeb = new TronWeb({ fullHost: fullNode });
    if (!txId) throw new Error("txId 不能为空");
    // TronWeb: trx.getTransactionInfo(txId)
    return (await (tronWeb.trx as any).getTransactionInfo(txId)) as any;
  }

  /**
   * 转账 TRX（对标 PHP /wallet/createtransaction + broadcasttransaction）
   * @returns txId
   */
  async transferTrx(options: TransferTrxOptions): Promise<string> {
    this.ensureReady();
    const { fromAddress, toAddress, amountSun, permissionId } = options;
    if (!fromAddress) throw new Error("fromAddress 不能为空");
    if (!toAddress) throw new Error("toAddress 不能为空");
    if (!Number.isFinite(amountSun) || amountSun <= 0) {
      throw new Error("amountSun 必须 > 0");
    }

    const tx = await (this.tronWeb as any).transactionBuilder.sendTrx(
      toAddress,
      amountSun,
      fromAddress,
      permissionId ? { permissionId: Number(permissionId) } : undefined
    );
    // 根据 fromAddress 读取对应私钥进行签名
    const privateKey = TronUtils.readPrivateKeyFromFile(fromAddress);
    const signed = await this.tronWeb!.trx.sign(tx, privateKey);
    const result = await this.tronWeb!.trx.sendRawTransaction(signed);
    if (!result.result) {
      const msg = result.message ?? result.code ?? "未知错误";
      throw new Error(`TRX 转账失败: ${JSON.stringify(msg)}`);
    }
    return result.txid ?? tx.txID;
  }

  /** 是否已就绪（已配置私钥并可发起交易） */
  isReady(): boolean {
    return this.tronWeb !== null;
  }

  /**
   * 派发资源：将带宽或能量委托给目标地址
   * @returns 交易 ID，失败时抛出异常
   */
  async delegateResource(options: DelegateResourceOptions): Promise<string> {
    this.ensureReady();
    const {
      receiverAddress,
      resource,
      amountSun,
      lock = false,
      lockPeriod = 0,
      ownerAddress,
      permissionId,
    } = options;
    const defaultAddr = this.tronWeb!.defaultAddress.base58;
    const address =
      ownerAddress ?? (typeof defaultAddr === "string" ? defaultAddr : null);
    if (!address) {
      throw new Error(
        "未配置默认地址或 ownerAddress，请设置 TRON_PRIVATE_KEY 或传入 ownerAddress"
      );
    }
    if (amountSun <= 0) {
      throw new Error("派发数量必须大于 0（单位：sun）");
    }

    this.logger.log(
      `派发资源: ${resource} ${amountSun} sun ${address} -> ${receiverAddress}, 锁定=${lock}, lockPeriod=${lockPeriod}, 权限ID=${permissionId}`
    );

    const transaction = await this.tronWeb!.transactionBuilder.delegateResource(
      amountSun,
      receiverAddress,
      resource,
      address,
      lock,
      lockPeriod,
      permissionId ? { permissionId: Number(permissionId) } : undefined
    );
    // const signed = await this.tronWeb!.trx.sign(transaction);
    // ✅ 使用专门的 multiSign 方法
    const privateKey = await getTronPrivateKey(this.config);
    const signedTx = await this.tronWeb!.trx.multiSign(
      transaction,
      privateKey,
      permissionId
    );
    const result = await this.tronWeb!.trx.sendRawTransaction(signedTx);

    if (!result.result) {
      const msg = result.message ?? result.code ?? "未知错误";
      throw new Error(`派发资源失败: ${JSON.stringify(msg)}`);
    }
    const txId = result.txid ?? transaction.txID;
    this.logger.log(`派发成功 txId=${txId}`);
    return txId;
  }

  /**
   * 回收资源：从目标地址收回已委托的带宽或能量
   * @returns 交易 ID，失败时抛出异常
   */
  async undelegateResource(
    options: UndelegateResourceOptions
  ): Promise<string> {
    this.ensureReady();
    const { receiverAddress, resource, amountSun, ownerAddress, permissionId } =
      options;
    const defaultAddr = this.tronWeb!.defaultAddress.base58;
    const address =
      ownerAddress ?? (typeof defaultAddr === "string" ? defaultAddr : null);
    if (!address) {
      throw new Error(
        "未配置默认地址或 ownerAddress，请设置 TRON_PRIVATE_KEY 或传入 ownerAddress"
      );
    }
    if (amountSun <= 0) {
      throw new Error("回收数量必须大于 0（单位：sun）");
    }

    this.logger.log(
      `回收资源: ${resource} ${amountSun} sun <- ${receiverAddress}`
    );

    const transaction =
      await this.tronWeb!.transactionBuilder.undelegateResource(
        amountSun,
        receiverAddress,
        resource,
        address,
        permissionId ? { permissionId: Number(permissionId) } : undefined
      );
    // const signed = await this.tronWeb!.trx.sign(transaction);
    const privateKey = await getTronPrivateKey(this.config);
    const signedTx = await this.tronWeb!.trx.multiSign(
      transaction,
      privateKey,
      permissionId
    );
    const result = await this.tronWeb!.trx.sendRawTransaction(signedTx);

    if (!result.result) {
      const msg = result.message ?? result.code ?? "未知错误";
      throw new Error(`回收资源失败: ${JSON.stringify(msg)}`);
    }
    const txId = result.txid ?? transaction.txID;
    this.logger.log(`回收成功 txId=${txId}`);
    return txId;
  }

  /**
   * 将 TRX 数量转为 sun（1 TRX = 1e6 sun）
   */
  static trxToSun(trx: number): number {
    return Math.floor(trx * 1e6);
  }

  /**
   * 将 sun 转为 TRX
   */
  static sunToTrx(sun: number): number {
    return sun / 1e6;
  }

  private ensureReady(): void {
    if (!this.tronWeb) {
      throw new Error("TronResourceService 未就绪，请配置 TRON_PRIVATE_KEY");
    }
  }
}
