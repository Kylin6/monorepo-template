import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("access_token", ["accessToken"], { unique: true })
@Index("email", ["username"], { unique: true })
@Index("password_reset_token", ["passwordResetToken"], { unique: true })
@Entity("adminUser", { schema: "test_api" })
export class AdminUser {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id!: number;

  @Column("varchar", {
    name: "username",
    nullable: true,
    unique: true,
    length: 255,
  })
  username!: string | null;

  @Column("tinyint", { name: "type", default: () => "'30'" })
  type!: number;

  @Column("varchar", { name: "authKey", nullable: true, length: 32 })
  authKey!: string | null;

  @Column("varchar", { name: "passwordHash", nullable: true, length: 255 })
  passwordHash!: string | null;

  @Column("varchar", {
    name: "passwordResetToken",
    nullable: true,
    unique: true,
    length: 255,
  })
  passwordResetToken!: string | null;

  @Column("int", { name: "createdAt" })
  createdAt!: number;

  @Column("int", { name: "updatedAt" })
  updatedAt!: number;

  @Column("varchar", { name: "googleSecret", nullable: true, length: 32 })
  googleSecret!: string | null;

  @Column("varchar", {
    name: "accessToken",
    nullable: true,
    unique: true,
    length: 32,
  })
  accessToken!: string | null;

  @Column("tinyint", { name: "twoStepValidate", default: () => "'0'" })
  twoStepValidate!: number;

  @Column("int", { name: "lastLoginAt", nullable: true })
  lastLoginAt!: number | null;

  @Column("varchar", { name: "lastLoginIp", nullable: true, length: 16 })
  lastLoginIp!: string | null;

  @Column("text", { name: "remark", nullable: true })
  remark!: string | null;

  @Column("int", { name: "accessTokenExpired", default: () => "'0'" })
  accessTokenExpired!: number;

  @Column("smallint", { name: "status", default: () => "'10'" })
  status!: number;
}
