import { Column, Entity, Index } from "typeorm";

@Index("uid", ["uid", "type"], { unique: true })
@Entity("notify_deny", { schema: "trxen" })
export class NotifyDeny {
  @Column("int", { name: "uid" })
  uid: number;

  @Column("int", { name: "type", default: () => "'0'" })
  type: number;
}
