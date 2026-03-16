import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";

@Entity("orders", { schema: "test_api" })
export class Orders {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "orderNumber", length: 255 })
  orderNumber: string;

  @Column("decimal", { name: "amount", precision: 10, scale: 2 })
  amount: string;

  @Column("varchar", { name: "currency", length: 255 })
  currency: string;

  @Column("varchar", {
    name: "status",
    length: 255,
    default: () => "'pending'",
  })
  status: string;

  @Column("varchar", { name: "description", nullable: true, length: 255 })
  description: string | null;

  @Column("varchar", { name: "paymentMethod", nullable: true, length: 255 })
  paymentMethod: string | null;

  @Column("varchar", { name: "transactionId", nullable: true, length: 255 })
  transactionId: string | null;

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

  @ManyToOne(() => Users, (users) => users.orders, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn([{ name: "userId", referencedColumnName: "id" }])
  user: Users;
}
