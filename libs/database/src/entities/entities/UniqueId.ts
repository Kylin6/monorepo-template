import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("unique_id", { schema: "trxen" })
export class UniqueId {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;
}
