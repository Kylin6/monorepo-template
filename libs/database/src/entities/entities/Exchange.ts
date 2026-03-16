import { Column, Entity } from "typeorm";

@Entity("exchange", { schema: "trxen" })
export class Exchange {
  @Column("int", { primary: true, name: "id" })
  id: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("char", { name: "transfer_in_tx_id", nullable: true, length: 64 })
  transferInTxId: string | null;

  @Column("char", { name: "transfer_out_tx_id", nullable: true, length: 64 })
  transferOutTxId: string | null;

  @Column("char", { name: "from", comment: "发送地址", length: 34 })
  from: string;

  @Column("char", { name: "to", comment: "接收地址", length: 34 })
  to: string;

  @Column("char", { name: "owner", nullable: true, length: 34 })
  owner: string | null;

  @Column("decimal", {
    name: "amount",
    comment: "接收数量",
    precision: 20,
    scale: 6,
  })
  amount: string;

  @Column("enum", { name: "currency", comment: "币种", enum: ["USDT", "TRX"] })
  currency: "USDT" | "TRX";

  @Column("decimal", {
    name: "base_rate",
    nullable: true,
    precision: 6,
    scale: 3,
  })
  baseRate: string | null;

  @Column("decimal", { name: "rate", comment: "汇率", precision: 6, scale: 3 })
  rate: string;

  @Column("decimal", {
    name: "exchange",
    comment: "发送数量",
    precision: 10,
    scale: 2,
  })
  exchange: string;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "transfered_at", nullable: true })
  transferedAt: number | null;

  @Column("tinyint", { name: "status", comment: "状态", default: "0"})
  status: number;
}
