/**
 * 备注工具类，负责 remark 字段的统一结构处理
 */
export interface RemarkEntry {
  time: number;
  contents: string;
}

export class RemarkUtils {
  /**
   * 将新的备注内容插入 remark JSON 字段前端
   */
  static addRemark(
    currentRemark: string | null | undefined,
    newRemark: string
  ): string {
    const entry: RemarkEntry = {
      time: Math.floor(Date.now() / 1000),
      contents: newRemark,
    };

    try {
      const parsed = currentRemark ? JSON.parse(currentRemark) : [];
      const remarks = Array.isArray(parsed) ? parsed : [];
      remarks.unshift(entry);
      return JSON.stringify(remarks);
    } catch (_error) {
      // remark 内容损坏时重建结构，避免抛出异常
      return JSON.stringify([entry]);
    }
  }
}
