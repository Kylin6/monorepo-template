import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("addr", ["addr"], { unique: true })
@Entity("authorized_wallet", { schema: "trxen" })
export class AuthorizedWallet {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("tinyint", { name: "type", default: () => "'0'" })
  type: number;

  @Column("int", { name: "uid", nullable: true })
  uid: number | null;

  @Column("char", { name: "addr", unique: true, length: 34 })
  addr: string;

  @Column("char", { name: "delegate_addr", nullable: true, length: 34 })
  delegateAddr: string | null;

  @Column("int", { name: "energy", nullable: true, default: () => "'0'" })
  energy: number | null;

  @Column("int", { name: "bandwidth", nullable: true, default: () => "'0'" })
  bandwidth: number | null;

  @Column("int", { name: "energy_usage", nullable: true })
  energyUsage: number | null;

  @Column("int", { name: "bandwidth_usage", nullable: true })
  bandwidthUsage: number | null;

  @Column("int", {
    name: "delegated_frozen_v2_balance_for_energy",
    nullable: true,
  })
  delegatedFrozenV2BalanceForEnergy: number | null;

  @Column("int", {
    name: "acquired_delegated_frozen_v2_balance_for_energy",
    nullable: true,
  })
  acquiredDelegatedFrozenV2BalanceForEnergy: number | null;

  @Column("int", {
    name: "acquired_delegated_frozen_v2_balance_for_bandwidth",
    nullable: true,
  })
  acquiredDelegatedFrozenV2BalanceForBandwidth: number | null;

  @Column("int", { name: "energy_limit", nullable: true })
  energyLimit: number | null;

  @Column("int", { name: "bandwidth_limit", nullable: true })
  bandwidthLimit: number | null;

  @Column("int", { name: "energy_total", nullable: true })
  energyTotal: number | null;

  @Column("int", { name: "bandwidth_total", nullable: true })
  bandwidthTotal: number | null;

  @Column("text", { name: "active_permissions", nullable: true })
  activePermissions: string | null;

  @Column("int", { name: "permission_id", nullable: true })
  permissionId: number | null;

  @Column("tinyint", { name: "authorized_count", nullable: true })
  authorizedCount: number | null;

  @Column("decimal", {
    name: "proportion",
    nullable: true,
    comment: "分成",
    precision: 5,
    scale: 2,
  })
  proportion: string | null;

  @Column("decimal", {
    name: "bandwidth_proportion",
    nullable: true,
    precision: 5,
    scale: 2,
  })
  bandwidthProportion: string | null;

  @Column("tinyint", { name: "proportion_fixed", nullable: true })
  proportionFixed: number | null;

  @Column("tinyint", { name: "bandwidth_proportion_fixed", nullable: true })
  bandwidthProportionFixed: number | null;

  @Column("int", { name: "stake_for_bandwidth", nullable: true })
  stakeForBandwidth: number | null;

  @Column("int", { name: "stake_for_energy", nullable: true })
  stakeForEnergy: number | null;

  @Column("int", { name: "total", nullable: true, default: () => "'0'" })
  total: number | null;

  @Column("int", { name: "available", nullable: true, default: () => "'0'" })
  available: number | null;

  @Column("decimal", {
    name: "usdt_balance",
    nullable: true,
    precision: 18,
    scale: 6,
  })
  usdtBalance: string | null;

  @Column("tinyint", { name: "sell_energy", nullable: true })
  sellEnergy: number | null;

  @Column("tinyint", { name: "sell_bandwidth", nullable: true })
  sellBandwidth: number | null;

  @Column("int", { name: "energy_min_price", nullable: true })
  energyMinPrice: number | null;

  @Column("int", { name: "bandwidth_min_price", nullable: true })
  bandwidthMinPrice: number | null;

  @Column("tinyint", { name: "auto_vote", nullable: true })
  autoVote: number | null;

  @Column("tinyint", { name: "auto_vote_withdraw", nullable: true })
  autoVoteWithdraw: number | null;

  @Column("tinyint", { name: "auto_withdraw", nullable: true })
  autoWithdraw: number | null;

  @Column("int", { name: "auto_withdraw_keep", nullable: true })
  autoWithdrawKeep: number | null;

  @Column("tinyint", { name: "lock", default: () => "'10'" })
  lock: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("decimal", {
    name: "balance",
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  balance: string;

  @Column("varchar", { name: "allow_expire", nullable: true, length: 255 })
  allowExpire: string | null;

  @Column("varchar", {
    name: "allow_bandwidth_expire",
    nullable: true,
    length: 255,
  })
  allowBandwidthExpire: string | null;

  @Column("tinyint", { name: "source", default: () => "'10'" })
  source: number;

  @Column("decimal", {
    name: "commission",
    comment: "总佣金",
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  commission: string;

  @Column("int", { name: "weights", nullable: true, comment: "权重" })
  weights: number | null;

  @Column("int", { name: "sort", default: () => "'0'" })
  sort: number;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
