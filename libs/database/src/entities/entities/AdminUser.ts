import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("email", ["username"], { unique: true })
@Index("password_reset_token", ["passwordResetToken"], { unique: true })
@Index("access_token", ["accessToken"], { unique: true })
@Entity("admin_user", { schema: "trxen" })
export class AdminUser {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", {
    name: "username",
    nullable: true,
    unique: true,
    length: 255,
  })
  username: string | null;

  @Column("tinyint", { name: "type", default: () => "'30'" })
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

  @Column("varchar", { name: "google_secret", nullable: true, length: 32 })
  googleSecret: string | null;

  @Column("varchar", {
    name: "access_token",
    nullable: true,
    unique: true,
    length: 32,
  })
  accessToken: string | null;

  @Column("tinyint", { name: "two_step_validate", nullable: true })
  twoStepValidate: number | null;

  @Column("int", { name: "last_login_at", nullable: true })
  lastLoginAt: number | null;

  @Column("varchar", { name: "last_login_ip", nullable: true, length: 16 })
  lastLoginIp: string | null;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("int", { name: "access_token_expired", nullable: true })
  accessTokenExpired: number | null;

  @Column("smallint", { name: "status", default: () => "'10'" })
  status: number;
}
