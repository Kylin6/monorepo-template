import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("uid", ["uid", "addr"], { unique: true })
@Entity("receiver_address", { schema: "trxen" })
export class ReceiverAddress {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("char", { name: "addr", length: 34 })
  addr: string;

  @Column("tinyint", { name: "is_main", nullable: true })
  isMain: number | null;

  @Column("int", { name: "sort", nullable: true, default: () => "'0'" })
  sort: number | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
