import { Column, Entity } from "typeorm";

@Entity("recharge_records", { schema: "trxen" })
export class RechargeRecords {
  @Column("int", { primary: true, name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("char", { name: "tx_id", nullable: true, length: 64 })
  txId: string | null;

  @Column("enum", { name: "type", enum: ["USDT", "TRX"] })
  type: "USDT" | "TRX";

  @Column("char", { name: "from_addr", nullable: true, length: 34 })
  fromAddr: string | null;

  @Column("char", { name: "to_addr", nullable: true, length: 34 })
  toAddr: string | null;

  @Column("decimal", { name: "amount", precision: 10, scale: 2 })
  amount: string;

  @Column("decimal", {
    name: "real_amount",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  realAmount: string | null;

  @Column("decimal", { name: "exchange", precision: 6, scale: 3 })
  exchange: string;

  @Column("decimal", {
    name: "recharge",
    precision: 10,
    scale: 2,
    default: "0.00",
  })
  recharge: string;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
