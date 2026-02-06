import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Orders } from "./Orders";

@Index("IDX_97672ac88f789774dd47f7c8be", ["email"], { unique: true })
@Entity("users", { schema: "test_api" })
export class Users {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "email", unique: true, length: 255 })
  email: string;

  @Column("tinyint", { name: "isActive", default: () => "'1'" })
  isActive: number;

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

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "avatar", nullable: true, length: 255 })
  avatar: string | null;

  @Column("varchar", { name: "password", length: 255 })
  password: string;

  @Column("varchar", { name: "accessToken", length: 255 })
  accessToken: string;

  @OneToMany(() => Orders, (orders) => orders.user)
  orders: Orders[];
}
