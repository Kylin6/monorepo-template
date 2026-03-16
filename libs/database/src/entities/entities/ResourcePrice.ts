import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("key", ["agentId", "key"], { unique: true })
@Entity("resource_price", { schema: "trxen" })
export class ResourcePrice {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "agent_id", nullable: true })
  agentId: number | null;

  @Column("decimal", {
    name: "in_price",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  inPrice: string | null;

  @Column("varchar", { name: "key", length: 32 })
  key: string;

  @Column("enum", { name: "type", enum: ["B", "E"] })
  type: "B" | "E";

  @Column("int", { name: "expire" })
  expire: number;

  @Column("enum", {
    name: "expire_type",
    nullable: true,
    enum: ["D", "H", "M"],
  })
  expireType: "D" | "H" | "M" | null;

  @Column("decimal", { name: "price", precision: 12, scale: 2 })
  price: string;

  @Column("tinyint", { name: "status", default: "10"})
  status: number;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;
}
