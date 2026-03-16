import { Column, Entity, Index } from "typeorm";

@Index("txID", ["txId"], { unique: true })
@Index("cNo", ["cNo"], { unique: true })
@Index("fromAddr", ["fromAddr"], {})
@Entity("lease_records", { schema: "trxen" })
export class LeaseRecords {
  @Column("int", { primary: true, name: "order_id" })
  orderId: number;

  @Column("varchar", {
    name: "c_no",
    nullable: true,
    unique: true,
    length: 255,
  })
  cNo: string | null;

  @Column("int", { name: "parent_order_id", nullable: true })
  parentOrderId: number | null;

  @Column("char", { name: "tx_id", nullable: true, unique: true, length: 64 })
  txId: string | null;

  @Column("int", { name: "uid", comment: "用户ID" })
  uid: number;

  @Column("enum", {
    name: "type",
    comment: "资源类型,E能量 B带宽",
    enum: ["B", "E"],
  })
  type: "B" | "E";

  @Column("tinyint", {
    name: "platform",
    nullable: true,
    comment: "卖家类型 0 系统钱包  10 内部钱包 20 卖家钱包",
    default: "0",
  })
  platform: number | null;

  @Column("tinyint", {
    name: "source",
    comment:
      "20 前台订单 24 telegram订单 25 赠送带宽订单  22 api订单 23 自动托管 ",
    default: () => "'10'",
  })
  source: number;

  @Column("int", { name: "plan_id", nullable: true })
  planId: number | null;

  @Column("bigint", { name: "amount", comment: "资源数量" })
  amount: string;

  @Column("decimal", {
    name: "stake_amount",
    nullable: true,
    precision: 20,
    scale: 2,
  })
  stakeAmount: string | null;

  @Column("decimal", {
    name: "stake_rate",
    nullable: true,
    precision: 10,
    scale: 3,
  })
  stakeRate: string | null;

  @Column("int", { name: "expire", comment: "过期时间值" })
  expire: number;

  @Column("enum", {
    name: "expire_type",
    nullable: true,
    enum: ["D", "H", "M"],
  })
  expireType: "D" | "H" | "M" | null;

  @Column("int", { name: "start_at", nullable: true })
  startAt: number | null;

  @Column("tinyint", {
    name: "locked",
    nullable: true,
    comment: "是否锁定",
    default: "0",
  })
  locked: number | null;

  @Column("int", { name: "expired_at", nullable: true })
  expiredAt: number | null;

  @Column("int", { name: "reclaimed_at", nullable: true })
  reclaimedAt: number | null;

  @Column("tinyint", { name: "reclaim_type", nullable: true })
  reclaimType: number | null;

  @Column("char", { name: "from_addr", nullable: true, length: 34 })
  fromAddr: string | null;

  @Column("char", { name: "to_addr", nullable: true, length: 34 })
  toAddr: string | null;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("int", { name: "seller_id", nullable: true })
  sellerId: number | null;

  @Column("decimal", {
    name: "price",
    comment: "单位SUN",
    precision: 10,
    scale: 2,
  })
  price: string;

  @Column("decimal", {
    name: "cost",
    comment: "单位TRX",
    precision: 10,
    scale: 2,
  })
  cost: string;

  @Column("decimal", {
    name: "agent_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  agentPrice: string | null;

  @Column("decimal", {
    name: "agent_cost",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  agentCost: string | null;

  @Column("decimal", {
    name: "commission",
    comment: "分红数量",
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  commission: string;

  @Column("decimal", {
    name: "agent_commission",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  agentCommission: string | null;

  @Column("decimal", {
    name: "net_cost",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  netCost: string | null;

  @Column("decimal", {
    name: "agent_net_cost",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  agentNetCost: string | null;

  @Column("decimal", {
    name: "total_cost",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  totalCost: string | null;

  @Column("decimal", {
    name: "agent_total_cost",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  agentTotalCost: string | null;

  @Column("decimal", {
    name: "net_profit",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  netProfit: string | null;

  @Column("int", { name: "try_counts", nullable: true })
  tryCounts: number | null;

  @Column("tinyint", {
    name: "progress",
    comment: "订单进程 (已废弃)",
    default: () => "'0'",
  })
  progress: number;

  @Column("decimal", {
    name: "balance",
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  balance: string;

  @Column("tinyint", {
    name: "status",
    comment: "订单状态",
    default: () => "'10'",
  })
  status: number;

  @Column("int", { name: "last_order_left", nullable: true })
  lastOrderLeft: number | null;

  @Column("int", { name: "last_order_id", nullable: true })
  lastOrderId: number | null;

  @Column("char", { name: "reclaim_tx_id", nullable: true, length: 64 })
  reclaimTxId: string | null;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
