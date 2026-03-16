import { Column, Entity, Index } from "typeorm";

@Index("txId", ["txId"], { unique: true })
@Entity("plan_transaction", { schema: "trxen" })
export class PlanTransaction {
  @Column("int", { primary: true, name: "id" })
  id: number;

  @Column("varchar", { name: "addr", nullable: true, length: 34 })
  addr: string | null;

  @Column("varchar", {
    name: "tx_id",
    nullable: true,
    unique: true,
    length: 255,
  })
  txId: string | null;

  @Column("varchar", { name: "contract_addr", nullable: true, length: 34 })
  contractAddr: string | null;

  @Column("decimal", {
    name: "energy_fee",
    nullable: true,
    precision: 12,
    scale: 6,
  })
  energyFee: string | null;

  @Column("int", { name: "energy_usage", nullable: true })
  energyUsage: number | null;

  @Column("decimal", {
    name: "bandwidth_fee",
    nullable: true,
    precision: 12,
    scale: 6,
  })
  bandwidthFee: string | null;

  @Column("int", { name: "bandwidth_usage", nullable: true })
  bandwidthUsage: number | null;

  @Column("int", { name: "transfer_at", nullable: true })
  transferAt: number | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("int", { name: "order_id", nullable: true })
  orderId: number | null;

  @Column("tinyint", { name: "status", default: () => "'0'" })
  status: number;
}
