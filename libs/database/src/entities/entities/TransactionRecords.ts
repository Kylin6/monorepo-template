import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("txID", ["txId", "amount"], { unique: true })
@Index("idx_transaction_hash", ["txId"], {})
@Index("idx_sender_address", ["fromAddr"], {})
@Index("idx_recipient_address", ["toAddr"], {})
@Index("idx_block_number", ["blockNumber"], {})
@Index("idx_timestamp", ["timestamp"], {})
@Entity("transaction_records", { schema: "trxen" })
export class TransactionRecords {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("char", { name: "tx_id", nullable: true, length: 64 })
  txId: string | null;

  @Column("bigint", { name: "block_number", nullable: true })
  blockNumber: string | null;

  @Column("int", { name: "timestamp", nullable: true })
  timestamp: number | null;

  @Column("char", { name: "from_addr", nullable: true, length: 34 })
  fromAddr: string | null;

  @Column("char", { name: "to_addr", nullable: true, length: 34 })
  toAddr: string | null;

  @Column("decimal", { name: "amount", precision: 20, scale: 6 })
  amount: string;

  @Column("enum", { name: "currency", enum: ["TRX", "USDT"] })
  currency: "TRX" | "USDT";

  @Column("decimal", {
    name: "fee",
    nullable: true,
    precision: 20,
    scale: 6,
    default: "0.000000",
  })
  fee: string | null;

  @Column("decimal", {
    name: "net_usage",
    nullable: true,
    precision: 20,
    scale: 6,
  })
  netUsage: string | null;

  @Column("decimal", {
    name: "net_fee",
    nullable: true,
    precision: 20,
    scale: 6,
  })
  netFee: string | null;

  @Column("decimal", {
    name: "energy_usage",
    nullable: true,
    precision: 20,
    scale: 6,
  })
  energyUsage: string | null;

  @Column("decimal", {
    name: "energy_fee",
    nullable: true,
    precision: 20,
    scale: 6,
  })
  energyFee: string | null;

  @Column("decimal", {
    name: "energy_usage_total",
    nullable: true,
    precision: 20,
    scale: 6,
  })
  energyUsageTotal: string | null;

  @Column("decimal", {
    name: "energy_penalty_total",
    nullable: true,
    precision: 20,
    scale: 6,
  })
  energyPenaltyTotal: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("tinyint", { name: "type", default: () => "'0'" })
  type: number;

  @Column("int", { name: "finished_at", nullable: true })
  finishedAt: number | null;

  @Column("tinyint", { name: "status", default: () => "'0'" })
  status: number;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;
}
