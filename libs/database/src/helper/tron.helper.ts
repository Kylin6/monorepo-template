import { createHash, createHmac } from "crypto";
import { keccak_256 } from "js-sha3";
import { hashes, sign } from "@noble/secp256k1";
import { PERMISSION_CODE } from "./permission-const.helper";

// Configure noble sync hashes for Node.js runtime
hashes.sha256 = (msg: Uint8Array): Uint8Array =>
  Uint8Array.from(createHash("sha256").update(msg).digest());
hashes.hmacSha256 = (key: Uint8Array, message: Uint8Array): Uint8Array =>
  Uint8Array.from(createHmac("sha256", key).update(message).digest());

export class TronHelper {
  static readonly CURRENCY_USDT = "USDT" as const;
  static readonly CURRENCY_TRX = "TRX" as const;

  static readonly RESOURCE_TYPE_ENERGY = "E" as const;
  static readonly RESOURCE_TYPE_BANDWIDTH = "B" as const;

  static readonly USDT_CONTRACT_ADDR =
    "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" as const;

  static getCurrencies(): Record<string, string> {
    return {
      [TronHelper.CURRENCY_USDT]: "USDT",
      [TronHelper.CURRENCY_TRX]: "TRX",
    };
  }

  static getResourceTypeTexts(): Record<string, string> {
    // PHP 里用了 Yii::t，这里保持纯函数：返回英文文本
    return {
      [TronHelper.RESOURCE_TYPE_ENERGY]: "Energy",
      [TronHelper.RESOURCE_TYPE_BANDWIDTH]: "Bandwidth",
    };
  }

  static parsePrice(text: string): string {
    // 对标 PHP：循环覆盖，最终返回最后一段的 price
    // 例： "0:123,1:456" -> "456"
    const pricesArr = text.split(",");
    let p = "";
    for (const item of pricesArr) {
      const priceArr = item.split(":");
      p = priceArr[1] ?? "";
    }
    return p;
  }

  static fromHex(str: string): string {
    if (str.length === 42 && str.slice(0, 2) === "41") {
      return TronHelper.hexString2Address(str);
    }
    return TronHelper.hexString2Utf8(str);
  }

  static toHex(str: string): string {
    if (str.length === 34 && str.slice(0, 1) === "T") {
      return TronHelper.address2HexString(str);
    }
    return TronHelper.stringUtf8toHex(str);
  }

  /**
   * Check the address before converting to Hex
   * - 输入如果已经是 41 开头的 hex 地址，直接返回
   * - 否则按 Tron Base58Check 解码
   */
  static address2HexString(addrOrHex: string): string {
    if (addrOrHex.length === 42 && addrOrHex.startsWith("41")) {
      return addrOrHex;
    }
    return TronHelper.base58CheckDecodeToHex(addrOrHex);
  }

  /**
   * Check Hex address before converting to Base58
   */
  static hexString2Address(hex: string): string {
    if (!TronHelper.isHex(hex)) return hex;
    if (hex.length < 2 || hex.length % 2 !== 0) return "";
    return TronHelper.base58CheckEncodeFromHex(hex);
  }

  static stringUtf8toHex(sUtf8: string): string {
    return Buffer.from(sUtf8, "utf8").toString("hex");
  }

  static hexString2Utf8(sHexString: string): string {
    return Buffer.from(sHexString, "hex").toString("utf8");
  }

  /**
   * PHP 版返回 BigInteger；TS 侧返回 bigint（大整数语义等价）
   */
  static toBigNumber(str: string | number | bigint): bigint {
    if (typeof str === "bigint") return str;
    if (typeof str === "number") return BigInt(Math.trunc(str));
    // 支持十进制字符串
    return BigInt(str);
  }

  static fromSun(amount: number): number {
    // 对标 PHP: round($amount / 1e6, 6)
    return Math.round((amount / 1e6) * 1e6) / 1e6;
  }

  static toSun(trx: number): number {
    // 对标 PHP: floor($double * 1e6)
    return Math.floor(trx * 1e6);
  }

  /**
   * Convert to SHA3 (Keccak-256)
   */
  static sha3(input: string, prefix = true): string {
    const hex = keccak_256(Buffer.from(input, "utf8"));
    return `${prefix ? "0x" : ""}${hex}`;
  }

  /**
   * 对标 PHP decodeHexData：解码 TRC20 transfer(data) 的收款地址与金额
   * - data 为不带 0x 的 hex 字符串
   */
  static decodeHexData(data: string): { to: string; amount: number } {
    const clean = data.startsWith("0x") ? data.slice(2) : data;
    // 接收者地址：methodId(8) + padding(24) 后取 40
    const rawRecipient = clean.slice(8 + 24, 8 + 24 + 40);
    const recipientHex = `41${rawRecipient}`;
    const recipient = TronHelper.hexString2Address(recipientHex);
    const rawAmount = clean.slice(72);
    const amount = rawAmount ? Number.parseInt(rawAmount, 16) : 0;
    return { to: recipient, amount };
  }

  static parsePermissions(hexString: string): number[] {
    const buf = Buffer.from(hexString, "hex");
    const restoredContractIds: number[] = [];
    for (let index = 0; index < buf.length; index++) {
      const byte = buf[index]!;
      for (let bit = 0; bit < 8; bit++) {
        if (byte & (1 << bit)) {
          restoredContractIds.push(index * 8 + bit);
        }
      }
    }
    return restoredContractIds;
  }

  /**
   * 对标 PHP TronHelper::parseAccountPermissionInfo
   *
   * @param addr    授权的钱包地址（delegateAddr）
   * @param account /wallet/getaccount 返回的账户信息
   */
  static parseAccountPermissionInfo(
    addr: string,
    account: any
  ): {
    permissionId: number | null;
    authorizedCount: number;
    authorized: number[];
  } {
    let authorizedCount = 0;
    let permissionId: number | null = null;
    let authorized: number[] = [];

    const activePermissions: any[] = Array.isArray(account?.active_permission)
      ? account.active_permission
      : [];

    const permissions: number[] = [
      PERMISSION_CODE.PER_DELEGATE_RESOURCE_CONTRACT,
      PERMISSION_CODE.PER_UNDELEGATE_RESOURCE_CONTRACT,
    ];

    for (const permission of activePermissions) {
      const firstKeyAddr = permission?.keys?.[0]?.address;
      // 跳过自身地址
      if (firstKeyAddr && firstKeyAddr === account?.address) {
        continue;
      }

      const opsHex: string | undefined = permission?.operations;
      if (!opsHex || typeof opsHex !== "string") continue;

      const ps = TronHelper.parsePermissions(opsHex);
      const intersect = ps.filter((id) => permissions.includes(id));

      if (intersect.length > 0) {
        authorizedCount++;
        if (intersect.length === 2 && firstKeyAddr === addr) {
          const idNum = Number(permission?.id);
          permissionId = Number.isFinite(idNum) ? idNum : null;
          authorized = ps;
        }
      }
    }

    return {
      permissionId,
      authorizedCount,
      authorized,
    };
  }

  /**
   * 对标 PHP sign(): 返回 65 字节 hex（r||s||recoveryId）
   *
   * - message: 32-byte hash 的 hex（Tron txID 即如此）
   * - privateKey: 32-byte hex
   */
  static sign(message: string, privateKey: string): string {
    const msg = TronHelper.hexToBytes(message);
    const pk = TronHelper.hexToBytes(privateKey);
    if (msg.length !== 32) {
      throw new Error("message must be 32-byte hex");
    }
    if (pk.length !== 32) {
      throw new Error("privateKey must be 32-byte hex");
    }

    const sigRecovered = sign(msg, pk, {
      prehash: false, // message 已经是 txID(hash)
      lowS: false, // 对标 PHP canonical=false
      format: "recovered",
    });

    // noble v3 的 recovered 格式：65 bytes = r(32) || s(32) || recovery(1)
    return Buffer.from(sigRecovered).toString("hex");
  }

  // ====== internal helpers (no external deps) ======

  private static isHex(s: string): boolean {
    return /^[0-9a-fA-F]+$/.test(s);
  }

  private static hexToBytes(hex: string): Uint8Array {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (!TronHelper.isHex(clean) || clean.length % 2 !== 0) {
      throw new Error("Invalid hex string");
    }
    return Uint8Array.from(Buffer.from(clean, "hex"));
  }

  private static sha256(buf: Uint8Array): Buffer {
    return createHash("sha256").update(buf).digest();
  }

  private static base58Alphabet =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  private static base58Encode(bytes: Uint8Array): string {
    if (bytes.length === 0) return "";
    const alphabet = TronHelper.base58Alphabet;

    // base58 encode via BigInt to keep it small/simple
    let x = BigInt("0x" + Buffer.from(bytes).toString("hex"));
    let out = "";
    while (x > 0n) {
      const mod = Number(x % 58n);
      out = alphabet[mod]! + out;
      x /= 58n;
    }

    // leading zero bytes -> '1'
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      out = "1" + out;
    }
    return out;
  }

  private static base58Decode(str: string): Uint8Array {
    const alphabet = TronHelper.base58Alphabet;
    const map = new Map<string, number>();
    for (let i = 0; i < alphabet.length; i++) map.set(alphabet[i]!, i);

    let x = 0n;
    for (const ch of str) {
      const val = map.get(ch);
      if (val === undefined) {
        throw new Error("Invalid base58 character");
      }
      x = x * 58n + BigInt(val);
    }

    let hex = x.toString(16);
    if (hex.length % 2) hex = "0" + hex;
    let bytes = hex.length
      ? Uint8Array.from(Buffer.from(hex, "hex"))
      : new Uint8Array();

    // restore leading zeros
    let leading = 0;
    for (const ch of str) {
      if (ch === "1") leading++;
      else break;
    }
    if (leading > 0) {
      const pref = new Uint8Array(leading);
      pref.fill(0);
      const merged = new Uint8Array(pref.length + bytes.length);
      merged.set(pref, 0);
      merged.set(bytes, pref.length);
      bytes = merged;
    }
    return bytes;
  }

  private static base58CheckEncodeFromHex(payloadHex: string): string {
    const payload = Buffer.from(payloadHex, "hex");
    const checksum = TronHelper.sha256(TronHelper.sha256(payload)).subarray(
      0,
      4
    );
    const full = Buffer.concat([payload, checksum]);
    return TronHelper.base58Encode(full);
  }

  private static base58CheckDecodeToHex(base58: string): string {
    const full = TronHelper.base58Decode(base58);
    if (full.length < 5) {
      throw new Error("Invalid base58check payload");
    }
    const payload = full.subarray(0, full.length - 4);
    const checksum = full.subarray(full.length - 4);
    const hash = TronHelper.sha256(TronHelper.sha256(payload)).subarray(0, 4);
    if (!Buffer.from(hash).equals(Buffer.from(checksum))) {
      throw new Error("Invalid base58check checksum");
    }
    return Buffer.from(payload).toString("hex");
  }
}
