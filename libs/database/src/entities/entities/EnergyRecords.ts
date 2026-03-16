import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("txID", ["txId"], { unique: true })
@Entity("energy_records", { schema: "trxen" })
export class EnergyRecords {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", {
    name: "tx_id",
    nullable: true,
    unique: true,
    length: 255,
  })
  txId: string | null;

  @Column("int", { name: "order_id", nullable: true })
  orderId: number | null;

  @Column("int", { name: "plan_id", nullable: true })
  planId: number | null;

  @Column("bigint", { name: "block_number", nullable: true })
  blockNumber: string | null;

  @Column("int", { name: "timestamp" })
  timestamp: number;

  @Column("char", { name: "from_addr", nullable: true, length: 34 })
  fromAddr: string | null;

  @Column("char", { name: "to_addr", nullable: true, length: 34 })
  toAddr: string | null;

  @Column("int", { name: "stake_amount", nullable: true })
  stakeAmount: number | null;

  @Column("decimal", { name: "amount", precision: 11, scale: 0 })
  amount: string;

  @Column("varchar", { name: "type", length: 50 })
  type: string;

  @Column("enum", { name: "resource", enum: ["E", "B"], default: "E" })
  resource: "E" | "B";

  @Column("decimal", {
    name: "fee",
    precision: 20,
    scale: 6,
    default: "0.000000",
  })
  fee: string;

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

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "finished_at", nullable: true })
  finishedAt: number | null;

  @Column("int", { name: "status", default: () => "'10'" })
  status: number;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;
}
