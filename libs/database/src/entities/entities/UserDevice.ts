import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("fingerprint", ["uid", "fingerprint"], { unique: true })
@Entity("user_device", { schema: "trxen" })
export class UserDevice {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("varchar", { name: "lang", nullable: true, length: 255 })
  lang: string | null;

  @Column("varchar", { name: "fingerprint", length: 255 })
  fingerprint: string;

  @Column("varchar", { name: "token", length: 32 })
  token: string;

  @Column("varchar", { name: "os", nullable: true, length: 32 })
  os: string | null;

  @Column("varchar", { name: "browser", nullable: true, length: 255 })
  browser: string | null;

  @Column("int", { name: "login_at", nullable: true })
  loginAt: number | null;

  @Column("varchar", { name: "login_ip", nullable: true, length: 255 })
  loginIp: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("varchar", { name: "last_active_ip", nullable: true, length: 255 })
  lastActiveIp: string | null;

  @Column("int", { name: "expired_at", nullable: true })
  expiredAt: number | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
