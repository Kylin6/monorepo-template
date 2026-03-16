import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("listened_addr", { schema: "trxen" })
export class ListenedAddr {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("char", { name: "addr", length: 34 })
  addr: string;

  @Column("int", { name: "amount_limit", nullable: true })
  amountLimit: number | null;

  @Column("tinyint", { name: "trx", default: () => "'0'" })
  trx: number;

  @Column("tinyint", { name: "usdt", default: () => "'0'" })
  usdt: number;

  @Column("tinyint", { name: "out", default: () => "'0'" })
  out: number;

  @Column("tinyint", { name: "in", default: () => "'0'" })
  in: number;

  @Column("varchar", { name: "telegram_id", nullable: true, length: 31 })
  telegramId: string | null;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
