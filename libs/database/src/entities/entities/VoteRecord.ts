import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("txID", ["txId"], {})
@Entity("vote_record", { schema: "trxen" })
export class VoteRecord {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("char", { name: "tx_id", nullable: true, length: 64 })
  txId: string | null;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("char", { name: "from", length: 34 })
  from: string;

  @Column("char", { name: "to", length: 34 })
  to: string;

  @Column("int", { name: "amount" })
  amount: number;

  @Column("tinyint", { name: "status", default: () => "'0'" })
  status: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
