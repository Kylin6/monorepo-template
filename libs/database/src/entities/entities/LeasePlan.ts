import { Column, Entity } from "typeorm";

@Entity("lease_plan", { schema: "trxen" })
export class LeasePlan {
  @Column("int", { primary: true, name: "plan_id" })
  planId: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("tinyint", {
    name: "cate",
    comment: "10 托管 20 笔数套餐",
    default: () => "'10'",
  })
  cate: number;

  @Column("tinyint", { name: "with_bandwidth", nullable: true })
  withBandwidth: number | null;

  @Column("int", {
    name: "uid",
    nullable: true,
    comment: "用户ID,如果没有则为笔数套餐",
  })
  uid: number | null;

  @Column("varchar", { name: "to_addr", nullable: true, length: 255 })
  toAddr: string | null;

  @Column("enum", {
    name: "type",
    comment: "类型 E能量 B带宽",
    enum: ["E", "B"],
  })
  type: "E" | "B";

  @Column("int", { name: "limit", comment: "托管数量" })
  limit: number;

  @Column("int", { name: "count", comment: "总笔数" })
  count: number;

  @Column("int", { name: "left", comment: "剩余笔数", default: "0" })
  left: number;

  @Column("decimal", {
    name: "recharge",
    nullable: true,
    comment: "充值金额",
    precision: 10,
    scale: 2,
  })
  recharge: string | null;

  @Column("date", { name: "start_at", nullable: true })
  startAt: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("int", { name: "last_check_at", nullable: true })
  lastCheckAt: number | null;

  @Column("varchar", { name: "currency", length: 7, default: () => "'TRX'" })
  currency: string;

  @Column("decimal", {
    name: "exchange",
    precision: 10,
    scale: 3,
    default: () => "'1.000'",
  })
  exchange: string;

  @Column("decimal", {
    name: "base_exchange",
    nullable: true,
    precision: 10,
    scale: 3,
  })
  baseExchange: string | null;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;

  // ================= 能量池配置 =================

  @Column("varchar", {
    name: "energy_pool_addr",
    nullable: true,
    length: 34,
  })
  energyPoolAddr: string | null;

  @Column("int", {
    name: "energy_pool_amount",
    nullable: true,
  })
  energyPoolAmount: number | null;

  @Column("int", {
    name: "energy_trigger",
    nullable: true,
  })
  energyTrigger: number | null;

  @Column("int", {
    name: "energy_supply",
    nullable: true,
  })
  energySupply: number | null;

  @Column("tinyint", {
    name: "energy_pool_status",
    default: () => "'0'",
  })
  energyPoolStatus: number | null;

  @Column("char", {
    name: "energy_tx_id",
    length: 64,
    nullable: true,
  })
  energyTxId: string | null;

  @Column("char", {
    name: "energy_reclaim_tx_id",
    length: 64,
    nullable: true,
  })
  energyReclaimTxId: string | null;

  @Column("decimal", {
    name: "energy_stake_amount",
    nullable: true,
    precision: 20,
    scale: 2,
  })
  energyStakeAmount: string | null;

  @Column("int", { name: "energy_delegate_at", nullable: true })
  energyDelegateAt: number | null;

  @Column("int", { name: "energy_reclaim_at", nullable: true })
  energyReclaimAt: number | null;

  // ================= 带宽池配置 =================

  @Column("varchar", {
    name: "net_pool_addr",
    nullable: true,
    length: 34,
  })
  netPoolAddr: string | null;

  @Column("int", {
    name: "net_pool_amount",
    nullable: true,
  })
  netPoolAmount: number | null;

  @Column("int", {
    name: "net_trigger",
    nullable: true,
  })
  netTrigger: number | null;

  @Column("int", {
    name: "net_supply",
    nullable: true,
  })
  netSupply: number | null;

  @Column("tinyint", {
    name: "net_pool_status",
    default: () => "'0'",
  })
  netPoolStatus: number | null;

  @Column("char", {
    name: "net_tx_id",
    length: 64,
    nullable: true,
  })
  netTxId: string | null;

  @Column("char", {
    name: "net_reclaim_tx_id",
    length: 64,
    nullable: true,
  })
  netReclaimTxId: string | null;

  @Column("decimal", {
    name: "net_stake_amount",
    nullable: true,
    precision: 20,
    scale: 2,
  })
  netStakeAmount: string | null;

  @Column("int", { name: "net_delegate_at", nullable: true })
  netDelegateAt: number | null;

  @Column("int", { name: "net_reclaim_at", nullable: true })
  netReclaimAt: number | null;
}
