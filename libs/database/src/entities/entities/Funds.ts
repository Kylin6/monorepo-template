import { Column, Entity } from "typeorm";

@Entity("funds", { schema: "trxen" })
export class Funds {
  @Column("int", { primary: true, name: "id" })
  id: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("tinyint", {
    name: "cate",
    comment: "10 买家 20 卖家 30 代理",
    default: () => "'10'",
  })
  cate: number;

  @Column("tinyint", {
    name: "type",
    comment: "10 充值 20 消费 30 提现 40 调账",
  })
  type: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("char", { name: "tx_id", nullable: true, length: 64 })
  txId: string | null;

  @Column("enum", { name: "currency", enum: ["USDT", "TRX"] })
  currency: "USDT" | "TRX";

  @Column("decimal", { name: "exchange", precision: 10, scale: 3 })
  exchange: string;

  @Column("int", { name: "order_id", nullable: true })
  orderId: number | null;

  @Column("int", { name: "plan_id", nullable: true })
  planId: number | null;

  @Column("decimal", { name: "amount", precision: 10, scale: 2 })
  amount: string;

  @Column("decimal", {
    name: "real_amount",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  realAmount: string | null;

  @Column("decimal", { name: "balance", precision: 10, scale: 2 })
  balance: string;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
