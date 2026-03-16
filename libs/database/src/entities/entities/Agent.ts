import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("uid", ["uid"], { unique: true })
@Index("addr", ["addr"], { unique: true })
@Index("username", ["username"], { unique: true })
@Entity("agent", { schema: "trxen" })
export class Agent {
  @PrimaryGeneratedColumn({ type: "int", name: "uid", comment: "代理ID" })
  uid: number;

  @Column("varchar", {
    name: "username",
    nullable: true,
    unique: true,
    comment: "用户名",
    length: 31,
  })
  username: string | null;

  @Column("varchar", { name: "password_hash", nullable: true, length: 64 })
  passwordHash: string | null;

  @Column("int", { name: "parent_id", nullable: true })
  parentId: number | null;

  @Column("varchar", { name: "bot_token", nullable: true, length: 255 })
  botToken: string | null;

  @Column("varchar", { name: "bot_username", nullable: true, length: 255 })
  botUsername: string | null;

  @Column("char", {
    name: "addr",
    nullable: true,
    unique: true,
    comment: "代理地址-频道能量",
    length: 34,
  })
  addr: string | null;

  @Column("char", { name: "recharge_addr", nullable: true, length: 34 })
  rechargeAddr: string | null;

  @Column("char", { name: "u2t_addr", nullable: true, length: 34 })
  u2tAddr: string | null;

  @Column("char", { name: "agent_recharge_addr", nullable: true, length: 34 })
  agentRechargeAddr: string | null;

  @Column("varchar", {
    name: "nickname",
    nullable: true,
    comment: "昵称",
    length: 255,
  })
  nickname: string | null;

  @Column("decimal", {
    name: "price",
    comment: "频道价格",
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  price: string;

  @Column("decimal", {
    name: "plan_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  planPrice: string | null;

  @Column("decimal", {
    name: "plan_out_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  planOutPrice: string | null;

  @Column("decimal", {
    name: "count_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  countPrice: string | null;

  @Column("decimal", {
    name: "count_out_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  countOutPrice: string | null;

  @Column("decimal", {
    name: "count_bandwidth_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  countBandwidthPrice: string | null;

  @Column("decimal", {
    name: "count_bandwidth_out_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  countBandwidthOutPrice: string | null;

  @Column("decimal", {
    name: "quick_energy_change",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  quickEnergyChange: string | null;

  @Column("varchar", {
    name: "domain",
    nullable: true,
    comment: "网站域名",
    length: 255,
  })
  domain: string | null;

  @Column("varchar", {
    name: "support",
    nullable: true,
    comment: "客服飞机号",
    length: 255,
  })
  support: string | null;

  @Column("varchar", {
    name: "channel",
    nullable: true,
    comment: "频道地址",
    length: 255,
  })
  channel: string | null;

  @Column("decimal", {
    name: "u2t_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  u2tPrice: string | null;

  @Column("varchar", { name: "notify_url", nullable: true, length: 255 })
  notifyUrl: string | null;

  @Column("decimal", {
    name: "balance",
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  balance: string;

  @Column("varchar", { name: "access_token", nullable: true, length: 32 })
  accessToken: string | null;

  @Column("int", { name: "token_expired_at", nullable: true })
  tokenExpiredAt: number | null;

  @Column("text", { name: "remark", nullable: true, comment: "代理备注" })
  remark: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("int", { name: "last_login_at", nullable: true })
  lastLoginAt: number | null;

  @Column("int", { name: "last_login_ip", nullable: true })
  lastLoginIp: number | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
