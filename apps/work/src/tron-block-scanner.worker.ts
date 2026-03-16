import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { connect, JSONCodec, NatsConnection, Subscription } from "nats";
import * as crypto from "crypto";
import { Repository } from "typeorm";
import { getStakeExchange } from "@database/helper/sys-cfg.helper";
import {
  getDataSource,
  AuthorizedWallet,
  AUTHORIZED_WALLET_TYPE,
  LeasePlan,
  LEASE_PLAN_CATE,
  SysCfg,
  TransactionRecords,
  EnergyRecords,
  UniqueId,
} from "@database/index";
import { PlanTransaction } from "@database/entities/entities/PlanTransaction";
import { createUniqueId } from "@database/helper/unique-id.helper";

// === Tron 类型定义（简化版）===
interface TronContractValue {
  owner_address?: string;
  to_address?: string;
  receiver_address?: string;
  contract_address?: string;
  amount?: number;
  data?: string;
  resource?: string;
  balance?: string;
  [key: string]: any;
}

interface TronTransaction {
  txID: string;
  ret: Array<{
    contractRet: string;
  }>;
  raw_data: {
    contract: Array<{
      type: string;
      parameter: {
        value: TronContractValue;
      };
    }>;
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
  };
}

interface TronBlock {
  block_header: {
    raw_data: {
      number: number;
      timestamp: number;
      txTrieRoot: string;
      parentHash: string;
      version: number;
      witness_address: string;
    };
  };
  transactions?: TronTransaction[];
}

/**
 * Tron 区块订阅 Worker
 *
 * - 通过 NATS 订阅 scan-tron 推送的区块消息
 * - 默认订阅主题：tron.block.latest
 * - 后续可以在这里将区块写入数据库 / 入队列等
 *
 * 环境变量：
 * - NATS_URL           NATS 地址，示例：nats://127.0.0.1:4222
 * - TRON_BLOCK_TOPIC   订阅的区块主题，默认 tron.block.latest
 */
@Injectable()
export class TronBlockScannerWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TronBlockScannerWorker.name);
  private nc: NatsConnection | null = null;
  private sub: Subscription | null = null;
  private listenedAddrs: string[] = [];
  private planAddrs: string[] = [];
  private transactionRecordsRepo!: Repository<TransactionRecords>;
  private energyRecordsRepo!: Repository<EnergyRecords>;
  private planTransactionRepo!: Repository<PlanTransaction>;
  private uniqueIdRepo!: Repository<UniqueId>;
  private sysCfgRepo!: Repository<SysCfg>;

  async onModuleInit() {
    const natsUrl = process.env.NATS_URL || "nats://127.0.0.1:4222";
    const subject = process.env.TRON_BLOCK_TOPIC || "tron.block.latest";

    try {
      // 初始化数据库连接与仓库
      const ds = await getDataSource();
      this.transactionRecordsRepo = ds.getRepository(TransactionRecords);
      this.energyRecordsRepo = ds.getRepository(EnergyRecords);
      this.planTransactionRepo = ds.getRepository(PlanTransaction);
      this.uniqueIdRepo = ds.getRepository(UniqueId);
      this.sysCfgRepo = ds.getRepository(SysCfg);
      await this.updateListenedAddrs();

      this.logger.log(`连接 NATS: ${natsUrl}`);
      this.nc = await connect({ servers: natsUrl });
      const jc = JSONCodec();

      this.logger.log(`订阅 Tron 区块主题: ${subject}`);
      this.sub = this.nc.subscribe(subject);

      (async () => {
        for await (const msg of this.sub!) {
          try {
            const decoded = jc.decode(msg.data) as any;
            // Nest ClientProxy.emit 发送 { pattern, data } 结构，这里兼容两种情况
            const block = (decoded?.data ?? decoded) as TronBlock;
            const num = block?.block_header?.raw_data?.number;
            // this.logger.log(`收到 Tron 区块: ${num}，交易数量: ${block?.transactions?.length}`);

            const blockData = block?.block_header?.raw_data;
            if (
              blockData &&
              block.transactions &&
              block.transactions.length > 0
            ) {
              await this.checkTransactions(block.transactions, blockData);
            }
          } catch (err) {
            this.logger.error(
              `处理区块消息失败: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
        }
      })().catch((err) => {
        this.logger.error(
          `订阅循环异常退出: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
    } catch (error) {
      this.logger.error(
        `连接或订阅 NATS 失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      if (this.sub) {
        this.sub.unsubscribe();
      }
      if (this.nc) {
        await this.nc.drain();
      }
    } catch (error) {
      this.logger.error(
        `关闭 NATS 连接失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 更新监听地址列表
   *
   * listenedAddrs 来源：
   * - AuthorizedWallet 表中 status = 10(ACTIVE) 的 addr
   * - SysCfg 中 key in ['rechargeAddr', 'u2tRechargeAddr'] 且 status = 10 的 value
   *
   * planAddrs 来源：
   * - LeasePlan 表中 status = 10 的 toAddr
   */
  private async updateListenedAddrs() {
    try {
      const ds = await getDataSource();
      const walletRepo = ds.getRepository(AuthorizedWallet);
      const sysCfgRepo = ds.getRepository(SysCfg);
      const leasePlanRepo = ds.getRepository(LeasePlan);

      const listenedAddrs: string[] = [];
      const planAddrs: string[] = [];

      // 1. AuthorizedWallet 中 status=10(ACTIVE) 的 addr
      const wallets = await walletRepo.find({
        where: {
          status: 10,
        },
        select: ["addr"],
      });
      for (const w of wallets) {
        if (w.addr) {
          listenedAddrs.push(w.addr.trim());
        }
      }

      // 2. SysCfg 中 key in ['rechargeAddr', 'u2tRechargeAddr'] 且 status=10 的 value
      const cfgItems = await sysCfgRepo.find({
        where: [
          { key: "rechargeAddr", status: 10 },
          { key: "u2tRechargeAddr", status: 10 },
          { key: "u2tOutTAddr", status: 10 },
        ],
      });
      for (const cfg of cfgItems) {
        if (cfg.value) {
          listenedAddrs.push(cfg.value.trim());
        }
      }

      // 3. LeasePlan 中 status=10 的 toAddr
      const leasePlans = await leasePlanRepo.find({
        where: {
          status: 10,
        },
        select: ["toAddr"],
      });
      for (const plan of leasePlans) {
        if (plan.toAddr) {
          planAddrs.push(plan.toAddr.trim());
        }
      }

      // 去重并过滤空值
      this.listenedAddrs = Array.from(
        new Set(
          listenedAddrs
            .map((addr) => addr.trim())
            .filter((addr) => addr.length > 0),
        ),
      );

      this.planAddrs = Array.from(
        new Set(
          planAddrs
            .map((addr) => addr.trim())
            .filter((addr) => addr.length > 0),
        ),
      );

      // this.logger.log(
      //   `已更新监听地址列表，共 ${this.listenedAddrs.length} 个地址`
      // );
    } catch (error) {
      this.logger.error(
        `更新监听地址列表失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.listenedAddrs = [];
      this.planAddrs = [];
    }
  }

  /**
   * 检查交易并处理
   */
  private async checkTransactions(
    transactions: TronTransaction[],
    block: TronBlock["block_header"]["raw_data"],
  ) {
    for (const transaction of transactions) {
      try {
        // 只处理成功的交易
        if (
          transaction.ret &&
          transaction.ret.length > 0 &&
          transaction.ret[0].contractRet === "SUCCESS"
        ) {
          const contractType = transaction.raw_data.contract?.[0]?.type || "";
          await this.handleTransaction(contractType, transaction, block);
        }
      } catch (error) {
        this.logger.error(
          `处理交易失败: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  /**
   * 根据合约类型处理交易
   */
  private async handleTransaction(
    contractType: string,
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
  ) {
    switch (contractType) {
      case CONTRACT_TYPE_TRANSFER:
        await this.handleTransferContract(transaction, block);
        break;
      case CONTRACT_TYPE_TRIGGER_SMART_CONTRACT:
        await this.handleTriggerSmartContract(transaction, block);
        break;
      case CONTRACT_TYPE_DELEGATE_RESOURCE:
        await this.handleDelegateResourceContract(transaction, block);
        break;
      case CONTRACT_TYPE_UNDELEGATE_RESOURCE:
        await this.handleUnDelegateResourceContract(transaction, block);
        break;
    }
  }

  /**
   * 处理 TRX 转账交易
   */
  private async handleTransferContract(
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
  ) {
    const contract = transaction.raw_data.contract[0];
    const value = contract.parameter.value;
    const to = hexString2Address(value.to_address || "");
    const from = hexString2Address(value.owner_address || "");

    // 检查转入
    if (this.listenedAddrs.includes(to)) {
      const record = this.loadTransferContract(transaction, block, 1);
      await this.insertTransactionRecord(record);
    }

    // 检查转出
    if (this.listenedAddrs.includes(from)) {
      const record = this.loadTransferContract(transaction, block, -1);
      await this.insertTransactionRecord(record);
    }
  }

  /**
   * 处理智能合约调用（主要是 USDT 转账）
   */
  private async handleTriggerSmartContract(
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
  ) {
    const contract = transaction.raw_data.contract[0];
    const value = contract.parameter.value;

    // 先检查是否是托管地址（planAddrs），如果是则写入 plan_transaction 表
    if (value.owner_address) {
      const ownerAddr = hexString2Address(value.owner_address);
      if (this.planAddrs.includes(ownerAddr)) {
        try {
          const id = await createUniqueId(this.uniqueIdRepo);
          const planTx: Partial<PlanTransaction> = {
            id,
            addr: ownerAddr,
            txId: transaction.txID,
          };
          await this.planTransactionRepo.insert(planTx);
        } catch (e) {
          this.logger.error(
            `插入 PlanTransaction 失败: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }
    }

    // 检查是否是 USDT 合约
    const contractAddr = hexString2Address(value.contract_address || "");
    if (contractAddr !== USDT_CONTRACT_ADDRESS) {
      return;
    }

    // 检查函数签名
    const dataHex = value.data || "";
    const functionSignature = dataHex.substring(0, 8);
    if (
      functionSignature !== TRANSFER_FROM_SIGNATURE &&
      functionSignature !== TRANSFER_SIGNATURE
    ) {
      return;
    }

    // 解析交易数据
    let from: string;
    let to: string;
    let amount: string;

    if (functionSignature === TRANSFER_FROM_SIGNATURE) {
      const decoded = this.parseTransferFrom(dataHex);
      from = decoded.from;
      to = decoded.to;
      amount = decoded.amount;
    } else {
      const decoded = this.parseTransfer(dataHex);
      from = hexString2Address(value.owner_address || "");
      to = decoded.to;
      amount = decoded.amount;
    }

    // 检查转入
    if (this.listenedAddrs.includes(to)) {
      const record = this.loadTriggerSmartContract(
        transaction,
        block,
        { from, to, amount },
        1,
      );
      await this.insertTransactionRecord(record);
    }

    // 检查转出
    if (this.listenedAddrs.includes(from)) {
      const record = this.loadTriggerSmartContract(
        transaction,
        block,
        { from, to, amount },
        -1,
      );
      await this.insertTransactionRecord(record);
    }
  }

  /**
   * 处理能量/带宽委托
   */
  private async handleDelegateResourceContract(
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
  ) {
    const contract = transaction.raw_data.contract[0];
    const value = contract.parameter.value;
    const from = hexString2Address(value.owner_address || "");

    if (this.listenedAddrs.includes(from)) {
      const record = await this.loadResourceContract(transaction, block, -1);
      await this.insertEnergyRecord(record);
    }
  }

  /**
   * 处理能量/带宽取消委托
   */
  private async handleUnDelegateResourceContract(
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
  ) {
    const contract = transaction.raw_data.contract[0];
    const value = contract.parameter.value;
    const from = hexString2Address(value.owner_address || "");

    if (this.listenedAddrs.includes(from)) {
      const record = await this.loadResourceContract(transaction, block, 1);
      await this.insertEnergyRecord(record);
    }
  }

  /**
   * 加载 TRX 转账记录
   */
  private loadTransferContract(
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
    direction: number,
  ): Partial<TransactionRecords> {
    const contract = transaction.raw_data.contract[0];
    const value = contract.parameter.value;
    const amount = value.amount ?? 0;

    return {
      txId: transaction.txID,
      blockNumber: String(block.number),
      timestamp: Math.floor(block.timestamp / 1000),
      fromAddr: hexString2Address(value.owner_address || ""),
      toAddr: hexString2Address(value.to_address || ""),
      amount: String(fromSun(amount * direction)),
      currency: "TRX",
      status: 0, // PENDING
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 加载 USDT 转账记录
   */
  private loadTriggerSmartContract(
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
    tradeInfo: { from: string; to: string; amount: string },
    direction: number,
  ): Partial<TransactionRecords> {
    return {
      txId: transaction.txID,
      blockNumber: String(block.number),
      timestamp: Math.floor(block.timestamp / 1000),
      fromAddr: tradeInfo.from,
      toAddr: tradeInfo.to,
      amount: String(fromSun(parseInt(tradeInfo.amount, 16) * direction)),
      currency: "USDT",
      status: 0, // PENDING
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 加载资源委托记录
   */
  private async loadResourceContract(
    transaction: TronTransaction,
    block: TronBlock["block_header"]["raw_data"],
    direction: number,
  ): Promise<Partial<EnergyRecords>> {
    const contract = transaction.raw_data.contract[0];
    const value = contract.parameter.value;
    const resource = value.resource === "ENERGY" ? "E" : "B";

    // 节点返回 balance 为 10 进制 Sun 数值（或数字字符串）
    const rawBalance =
      typeof value.balance === "string"
        ? Number(value.balance)
        : (value.balance ?? 0);

    const stakeAmount = Math.ceil(fromSun(rawBalance * direction));

    // 根据配置表获取质押兑换比例（参考 PHP SysHelper::getStakeExchange）
    let exchange = 1;
    try {
      const cfgExchange = await getStakeExchange(this.sysCfgRepo, resource);
      if (Number.isFinite(cfgExchange) && cfgExchange > 0) {
        exchange = cfgExchange;
      }
    } catch (e) {
      this.logger.error(
        `获取质押兑换比例失败: ${
          e instanceof Error ? e.message : String(e)
        }，使用默认 1:1`,
      );
    }
    const amount = Math.ceil(stakeAmount * exchange);

    // const type = direction < 0 ? "DELEGATE" : "UNDELEGATE";
    const type = direction < 0 ? "Delegate" : "Reclaim";

    return {
      txId: transaction.txID,
      blockNumber: String(block.number),
      timestamp: Math.floor(block.timestamp / 1000),
      fromAddr: hexString2Address(value.owner_address || ""),
      toAddr: hexString2Address(value.receiver_address || ""),
      resource: resource,
      stakeAmount: stakeAmount,
      amount: String(amount),
      type: type,
      status: 0, // PENDING
      createdAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 插入交易记录
   */
  private async insertTransactionRecord(record: Partial<TransactionRecords>) {
    try {
      // 确保地址都是 Base58 格式（T 开头）
      if (record.fromAddr && !record.fromAddr.startsWith("T")) {
        record.fromAddr = hexString2Address(record.fromAddr);
      }
      if (record.toAddr && !record.toAddr.startsWith("T")) {
        record.toAddr = hexString2Address(record.toAddr);
      }

      this.logger.debug(`有目标 trx 交易记录: ${JSON.stringify(record)}`);
      await this.transactionRecordsRepo.insert(record);
    } catch (error) {
      // 忽略重复记录错误
      if (
        error instanceof Error &&
        !error.message.includes("Duplicate entry")
      ) {
        this.logger.error(
          `插入交易记录失败: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  /**
   * 插入能量记录
   */
  private async insertEnergyRecord(record: Partial<EnergyRecords>) {
    try {
      // 确保地址都是 Base58 格式（T 开头）
      if (record.fromAddr && !record.fromAddr.startsWith("T")) {
        record.fromAddr = hexString2Address(record.fromAddr);
      }
      if (record.toAddr && !record.toAddr.startsWith("T")) {
        record.toAddr = hexString2Address(record.toAddr);
      }
      this.logger.debug(`有目标能量记录: ${JSON.stringify(record)}`);
      await this.energyRecordsRepo.insert(record);
    } catch (error) {
      // 忽略重复记录错误
      if (
        error instanceof Error &&
        !error.message.includes("Duplicate entry")
      ) {
        this.logger.error(
          `插入能量记录失败: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  /**
   * 解析 transferFrom 函数调用
   */
  private parseTransferFrom(hex: string): {
    from: string;
    to: string;
    amount: string;
  } {
    const from = hex.substring(8, 72);
    const fromAddress = from.substring(24);
    const to = hex.substring(72, 136);
    const toAddress = to.substring(24);
    const valueHex = hex.substring(136, 200);
    return {
      from: hexString2Address("41" + fromAddress),
      to: hexString2Address("41" + toAddress),
      amount: valueHex,
    };
  }

  /**
   * 解析 transfer 函数调用
   */
  private parseTransfer(hex: string): { to: string; amount: string } {
    const to = hex.substring(8, 72);
    const toAddress = to.substring(24);
    const valueHex = hex.substring(72, 136);
    return {
      to: hexString2Address("41" + toAddress),
      amount: valueHex,
    };
  }
}

// === Tron 工具函数 & 常量（从 tron-utils 迁移简化版）===

// USDT 合约地址（TRC20）
const USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// 函数签名
const TRANSFER_FROM_SIGNATURE = "23b872dd"; // transferFrom(address,address,uint256)
const TRANSFER_SIGNATURE = "a9059cbb"; // transfer(address,uint256)

// 合约类型
const CONTRACT_TYPE_TRANSFER = "TransferContract";
const CONTRACT_TYPE_TRIGGER_SMART_CONTRACT = "TriggerSmartContract";
const CONTRACT_TYPE_DELEGATE_RESOURCE = "DelegateResourceContract";
const CONTRACT_TYPE_UNDELEGATE_RESOURCE = "UnDelegateResourceContract";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(buffer: Buffer): string {
  if (buffer.length === 0) return "";

  let num = BigInt("0x" + buffer.toString("hex"));
  const base = BigInt(58);
  const result: string[] = [];

  while (num > 0) {
    const remainder = num % base;
    num = num / base;
    result.unshift(BASE58_ALPHABET[Number(remainder)]);
  }

  // 处理前导零
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result.unshift(BASE58_ALPHABET[0]);
  }

  return result.join("");
}

function calculateChecksum(buffer: Buffer): Buffer {
  const hash1 = crypto.createHash("sha256").update(buffer).digest();
  const hash2 = crypto.createHash("sha256").update(hash1).digest();
  return hash2.slice(0, 4);
}

function hexString2Address(hexAddress: string): string {
  // 如果已经是 Base58 格式（以 T 开头，34 个字符），直接返回
  if (hexAddress && hexAddress.startsWith("T") && hexAddress.length === 34) {
    return hexAddress;
  }

  if (!hexAddress || typeof hexAddress !== "string") {
    return hexAddress || "";
  }

  // 移除可能的 '0x' 前缀和空格
  let hex = hexAddress.replace(/^0x/i, "").trim();

  // 处理不同长度的十六进制地址
  let recognized = false;

  if (hex.length === 40) {
    // 40 字符 = 20 字节，需要添加 '41' 前缀（1字节版本号）
    hex = "41" + hex;
    recognized = true;
  }

  if (hex.length === 42 && hex.startsWith("41")) {
    // 已经是正确格式（42 字符 = 21 字节）
    recognized = true;
  }

  if (hex.length === 64) {
    // 64 字符 = 32 字节，取后 40 位（20字节）并添加 '41' 前缀
    hex = "41" + hex.substring(24);
    recognized = true;
  }

  if (hex.length === 66 && hex.startsWith("0x41")) {
    // 0x41 开头的 66 字符，移除 0x
    hex = hex.substring(2);
    recognized = true;
  }

  if (!recognized) {
    // 无法识别的格式，尝试直接转换
    if (hex.length % 2 !== 0) {
      return hexAddress; // 奇数长度，无法转换
    }
  }

  try {
    // 转换为 Buffer
    const addressBuffer = Buffer.from(hex, "hex");

    // Tron 地址应该是 21 字节（1 字节版本号 0x41 + 20 字节地址）
    if (addressBuffer.length !== 21) {
      return hexAddress;
    }

    // 计算校验和（double SHA256，取前4字节）
    const checksum = calculateChecksum(addressBuffer);

    // 组合地址 + 校验和（21 + 4 = 25 字节）
    const addressWithChecksum = Buffer.concat([addressBuffer, checksum]);

    // Base58 编码
    const base58 = base58Encode(addressWithChecksum);

    // 验证结果长度（Tron 地址通常是 34 个字符）
    if (base58.length === 34) {
      return base58;
    }

    // 如果长度不对，返回原值
    return hexAddress;
  } catch {
    // 转换失败，返回原值
    return hexAddress;
  }
}

function fromSun(sun: number | string): number {
  const sunNum = typeof sun === "string" ? parseFloat(sun) : sun;
  return sunNum / 1_000_000;
}
