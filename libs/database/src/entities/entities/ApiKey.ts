import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("api_key", { schema: "trxen" })
export class ApiKey {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("varchar", { name: "name", nullable: true, length: 32 })
  name: string | null;

  @Column("char", { name: "token", length: 32 })
  token: string;

  @Column("text", { name: "white_list", nullable: true })
  whiteList: string | null;

  @Column("text", { name: "ua", nullable: true })
  ua: string | null;

  @Column("varchar", { name: "notify_url", nullable: true, length: 255 })
  notifyUrl: string | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;
}
