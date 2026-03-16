import { Column, Entity } from "typeorm";

@Entity("user_extend", { schema: "trxen" })
export class UserExtend {
  @Column("int", { primary: true, name: "uid" })
  uid: number;

  @Column("int", { name: "wallet_verify_deadline", nullable: true })
  walletVerifyDeadline: number | null;

  @Column("int", { name: "email_verify_deadline", nullable: true })
  emailVerifyDeadline: number | null;

  @Column("varchar", {
    name: "telegram_notify_opt",
    nullable: true,
    length: 255,
  })
  telegramNotifyOpt: string | null;
}
