import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("agent_log", { schema: "trxen" })
export class AgentLog {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
