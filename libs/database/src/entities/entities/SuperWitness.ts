import { Column, Entity } from "typeorm";

@Entity("super_witness", { schema: "trxen" })
export class SuperWitness {
  @Column("char", { primary: true, name: "addr", length: 34 })
  addr: string;

  @Column("varchar", { name: "name", nullable: true, length: 255 })
  name: string | null;

  @Column("bigint", { name: "vote_count", nullable: true })
  voteCount: string | null;

  @Column("varchar", { name: "url", nullable: true, length: 255 })
  url: string | null;

  @Column("int", { name: "ranking", nullable: true })
  ranking: number | null;

  @Column("decimal", {
    name: "brokerage",
    nullable: true,
    precision: 4,
    scale: 2,
  })
  brokerage: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("tinyint", { name: "status", nullable: true, default: () => "'0'" })
  status: number | null;
}
