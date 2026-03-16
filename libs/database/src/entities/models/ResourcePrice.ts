import { ResourcePrice as GeneratedResourcePrice } from "../entities/ResourcePrice";
import type { Users as UserEntity } from "../entities/Users";

export class ResourcePriceModel extends GeneratedResourcePrice {
  /**
   * 计算指定用户在当前套餐下的最终单价
   * - type = "E"（能量）: 基础价格 + user.energy_price_float
   * - type = "B"（带宽）: 基础价格 + user.net_price_float
   */
  getFinalPriceForUser(
    user: Pick<UserEntity, "energyPriceFloat" | "netPriceFloat">
  ): number {
    const base = Number(this.price) || 0;
    const float =
      this.type === "B"
        ? Number(user.netPriceFloat ?? 0) || 0
        : Number(user.energyPriceFloat ?? 0) || 0;
    return base + float;
  }

  /**
   * 静态工具方法：不要求传入模型实例，只要有 price/type 字段即可
   */
  static getFinalPriceForUser(
    price: Pick<GeneratedResourcePrice, "price" | "type">,
    user: Pick<UserEntity, "energyPriceFloat" | "netPriceFloat">
  ): number {
    const base = Number(price.price) || 0;
    const float =
      price.type === "B"
        ? Number(user.netPriceFloat ?? 0) || 0
        : Number(user.energyPriceFloat ?? 0) || 0;
    return base + float;
  }
}
