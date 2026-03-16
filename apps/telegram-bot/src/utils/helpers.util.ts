// 生成问候语
export function generateGreeting(user: any, suffix: string = ""): string {
  const firstName = user.first_name || "";
  const username = user.username || "";

  if (firstName) {
    return `${firstName}${suffix}`;
  }

  if (username) {
    return `@${username}${suffix}`;
  }

  return `用户${suffix}`;
}
// 验证TRX地址格式
export function isValidTronAddress(address: string): boolean {
  const tronAddressRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
  return tronAddressRegex.test(address);
}
// 计算 sun --> trx
export function calculateEnergyCost(amount: number, price: number): number {
  return (amount * price) / 1000000;
}

// 格式化钱包地址：前6位...后8位
export function formatWalletAddr(addr: string): string {
  if (!addr || addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}......${addr.slice(-8)}`;
}

// hash 格式化
export function formatHash(hash: string): string {
  if (!hash || hash.length <= 14) return hash;
  return `...${hash.slice(-10)}`;
}

// 时间戳(秒) -> MM-DD HH:mm
export function formatTime(tsSec?: number | null): string {
  if (!tsSec) return "--:--";
  const d = new Date(tsSec * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${HH}:${MM}`;
}

// 资源时长格式化：expire + type(D/H/M)
export function formatExpire(expire: number, type: "D" | "H" | "M"): string {
  const unit = type === "D" ? "天" : type === "H" ? "小时" : "分钟";
  return `${expire} ${unit}`;
}

// 数量格式化：带千分位
export function formatAmount(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString();
}
