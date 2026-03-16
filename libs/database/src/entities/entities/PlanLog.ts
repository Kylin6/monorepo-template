import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("plan_log", { schema: "trxen" })
export class PlanLog {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("int", { name: "plan_id", nullable: true })
  planId: number | null;

  @Column("int", { name: "operate", comment: "10 开启 0 关闭 -10 删除" })
  operate: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("varchar", { name: "remark", length: 255 })
  remark: string;
}
