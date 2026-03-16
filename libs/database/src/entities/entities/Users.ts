import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("password_reset_token", ["passwordResetToken"], { unique: true })
@Index("verificationToken", ["verificationToken"], { unique: true })
@Index("telegramId", ["telegramId", "parentId"], { unique: true })
@Index("walletAddr", ["walletAddr", "parentId"], { unique: true })
@Index("username", ["username", "parentId"], { unique: true })
@Index("email", ["email", "parentId"], { unique: true })
@Entity("users", { schema: "trxen" })
export class Users {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "username", nullable: true, length: 255 })
  username: string | null;

  @Column("varchar", { name: "nickname", nullable: true, length: 255 })
  nickname: string | null;

  @Column("varchar", { name: "email", nullable: true, length: 255 })
  email: string | null;

  @Column("varchar", { name: "mobile", nullable: true, length: 16 })
  mobile: string | null;

  @Column("char", { name: "wallet_addr", nullable: true, length: 34 })
  walletAddr: string | null;

  @Column("varchar", { name: "telegram_id", nullable: true, length: 32 })
  telegramId: string | null;

  @Column("varchar", { name: "telegram_username", nullable: true, length: 255 })
  telegramUsername: string | null;

  @Column("varchar", { name: "telegram_nickname", nullable: true, length: 255 })
  telegramNickname: string | null;

  @Column("int", { name: "parent_id", nullable: true })
  parentId: number | null;

  @Column("tinyint", {
    name: "type",
    comment: "是否是卖家",
    default: () => "'0'",
  })
  type: number;

  @Column("varchar", { name: "auth_key", nullable: true, length: 32 })
  authKey: string | null;

  @Column("varchar", { name: "password_hash", nullable: true, length: 255 })
  passwordHash: string | null;

  @Column("varchar", {
    name: "password_reset_token",
    nullable: true,
    unique: true,
    length: 255,
  })
  passwordResetToken: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("varchar", {
    name: "verification_token",
    nullable: true,
    unique: true,
    length: 255,
  })
  verificationToken: string | null;

  @Column("varchar", { name: "google_secret", nullable: true, length: 32 })
  googleSecret: string | null;

  @Column("tinyint", { name: "two_step_validate", nullable: true })
  twoStepValidate: number | null;

  @Column("int", { name: "last_login_at", nullable: true })
  lastLoginAt: number | null;

  @Column("varchar", { name: "last_login_ip", nullable: true, length: 16 })
  lastLoginIp: string | null;

  @Column("decimal", {
    name: "balance",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  balance: string;

  @Column("varchar", { name: "source", nullable: true, length: 255 })
  source: string | null;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("int", { name: "mail_verified", nullable: true })
  mailVerified: number | null;

  @Column("int", { name: "wallet_verified", nullable: true })
  walletVerified: number | null;

  @Column("smallint", { name: "status", default: () => "'10'" })
  status: number;

  @Column("decimal", {
    name: "energy_price_float",
    comment: "时长能量价格浮动",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  energyPriceFloat: string;

  @Column("decimal", {
    name: "net_price_float",
    comment: "时长带宽价格浮动",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  netPriceFloat: string;

  @Column("decimal", {
    name: "plan_energy_price_float",
    comment: "托管能量价格浮动",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  planEnergyPriceFloat: string;

  @Column("decimal", {
    name: "plan_net_price_float",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  planNetPriceFloat: string;

  @Column("decimal", {
    name: "fast_energy_price_float",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  fastEnergyPriceFloat: string;

  @Column("decimal", {
    name: "fast_net_price_float",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  fastNetPriceFloat: string;
}
