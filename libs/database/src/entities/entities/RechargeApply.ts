import { Column, Entity } from "typeorm";

@Entity("recharge_apply", { schema: "trxen" })
export class RechargeApply {
  @Column("int", { primary: true, name: "id" })
  id: number;

  @Column("tinyint", { name: "cate" })
  cate: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("decimal", { name: "amount", precision: 10, scale: 4 })
  amount: string;

  @Column("varchar", { name: "currency", length: 7 })
  currency: string;

  @Column("char", { name: "to_addr", nullable: true, length: 34 })
  toAddr: string | null;

  @Column("int", { name: "count", nullable: true })
  count: number | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "expire_at", nullable: true })
  expireAt: number | null;

  @Column("text", { name: "extra", nullable: true })
  extra: string | null;

  @Column("tinyint", { name: "status" })
  status: number;
}
