import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("count", ["agentId", "count"], { unique: true })
@Entity("channel_price", { schema: "trxen" })
export class ChannelPrice {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("int", { name: "count" })
  count: number;

  @Column("decimal", { name: "start", precision: 4, scale: 2 })
  start: string;

  @Column("decimal", { name: "end", precision: 4, scale: 2 })
  end: string;

  @Column("decimal", { name: "show", precision: 4, scale: 2 })
  show: string;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
