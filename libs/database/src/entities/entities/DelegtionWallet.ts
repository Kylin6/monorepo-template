import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("delegtion_wallet", { schema: "trxen" })
export class DelegtionWallet {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("char", { name: "addr", length: 34 })
  addr: string;

  @Column("int", { name: "count", default: () => "'0'" })
  count: number;

  @Column("tinyint", { name: "status", default: () => "'10'" })
  status: number;
}
