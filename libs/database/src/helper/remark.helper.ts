export type RemarkEntry = { time: number; contents: string };

/**
 * 与 @libs/common/src/utils/remark.utils.ts 的 RemarkUtils.addRemark 保持同结构：
 * - remark 字段为 JSON 数组字符串
 * - 最新 entry 放在最前面
 */
export function addRemark(
  currentRemark: string | null | undefined,
  newRemark: string | null | undefined
): string | null {
  const text = newRemark?.trim();
  if (!text) return currentRemark ?? null;

  const entry: RemarkEntry = {
    time: Math.floor(Date.now() / 1000),
    contents: text,
  };

  try {
    const parsed = currentRemark ? JSON.parse(currentRemark) : [];
    const remarks = Array.isArray(parsed) ? parsed : [];
    remarks.unshift(entry);
    return JSON.stringify(remarks);
  } catch {
    return JSON.stringify([entry]);
  }
}

