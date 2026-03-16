import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("addr", ["addr"], { unique: true })
@Entity("addr_desc", { schema: "trxen" })
export class AddrDesc {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("char", { name: "addr", unique: true, length: 34 })
  addr: string;

  @Column("text", { name: "desc", nullable: true })
  desc: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;
}
