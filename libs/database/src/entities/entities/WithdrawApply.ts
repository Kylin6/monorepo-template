import { Column, Entity } from "typeorm";

@Entity("withdraw_apply", { schema: "trxen" })
export class WithdrawApply {
  @Column("int", { primary: true, name: "id" })
  id: number;

  @Column("char", { name: "tx_id", nullable: true, length: 64 })
  txId: string | null;

  @Column("tinyint", {
    name: "cate",
    comment: "10 卖家提现 20 代理提现",
    default: () => "'10'",
  })
  cate: number;

  @Column("int", { name: "uid" })
  uid: number;

  @Column("decimal", { name: "amount", precision: 10, scale: 2 })
  amount: string;

  @Column("decimal", {
    name: "fee",
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  fee: string;

  @Column("decimal", {
    name: "real_amount",
    nullable: true,
    precision: 10,
    scale: 2,
  })
  realAmount: string | null;

  @Column("char", { name: "from_addr", nullable: true, length: 34 })
  fromAddr: string | null;

  @Column("char", { name: "to_addr", nullable: true, length: 34 })
  toAddr: string | null;

  @Column("tinyint", { name: "type", comment: "10 手动提现 20 自动提现" })
  type: number;

  @Column("int", { name: "created_at", nullable: true })
  createdAt: number | null;

  @Column("int", { name: "finished_at", nullable: true })
  finishedAt: number | null;

  @Column("varchar", { name: "remark", nullable: true, length: 255 })
  remark: string | null;

  @Column("tinyint", {
    name: "status",
    comment: "0 已提交 10 处理中 20 已完成 -10 已取消 ",
    default: () => "'0'",
  })
  status: number;
}
