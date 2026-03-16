import { Column, Entity } from "typeorm";

@Entity("out_reach", { schema: "trxen" })
export class OutReach {
  @Column("int", { primary: true, name: "uid" })
  uid: number;

  @Column("varchar", { name: "nickname", nullable: true, length: 255 })
  nickname: string | null;

  @Column("decimal", {
    name: "commission_rate",
    nullable: true,
    precision: 4,
    scale: 3,
  })
  commissionRate: string | null;

  @Column("decimal", {
    name: "commission",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  commission: string;

  @Column("decimal", {
    name: "balance",
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  balance: string;

  @Column("text", { name: "remark", nullable: true })
  remark: string | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
