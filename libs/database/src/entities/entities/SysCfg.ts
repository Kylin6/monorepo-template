import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("key", ["key"], { unique: true })
@Entity("sys_cfg", { schema: "trxen" })
export class SysCfg {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "group", nullable: true, length: 255 })
  group: string | null;

  @Column("varchar", { name: "key", unique: true, length: 255 })
  key: string;

  @Column("varchar", { name: "value", length: 255 })
  value: string;

  @Column("varchar", { name: "rule", nullable: true, length: 255 })
  rule: string | null;

  @Column("varchar", { name: "desc", nullable: true, length: 255 })
  desc: string | null;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "updated_at", nullable: true })
  updatedAt: number | null;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
