import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("articles", { schema: "test_api" })
export class Articles {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("text", { name: "content", nullable: true })
  content: string | null;

  @Column("datetime", {
    name: "createdAt",
    default: () => "'CURRENT_TIMESTAMP(6)'",
  })
  createdAt: Date;

  @Column("datetime", {
    name: "updatedAt",
    default: () => "'CURRENT_TIMESTAMP(6)'",
  })
  updatedAt: Date;

  @Column("varchar", { name: "author", nullable: true, length: 255 })
  author: string | null;

  @Column("tinyint", { name: "published", default: () => "'1'" })
  published: number;
}
