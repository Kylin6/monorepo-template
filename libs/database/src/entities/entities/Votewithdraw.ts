import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("txid", ["txId"], { unique: true })
@Entity("votewithdraw", { schema: "trxen" })
export class Votewithdraw {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("char", { name: "tx_id", nullable: true, unique: true, length: 64 })
  txId: string | null;

  @Column("char", { name: "addr", length: 34 })
  addr: string;

  @Column("decimal", { name: "amount", precision: 12, scale: 6 })
  amount: string;

  @Column("tinyint", { name: "status", default: () => "'0'" })
  status: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
