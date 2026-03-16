import { AuthorizedWallet as GeneratedAuthorizedWallet } from "../entities/AuthorizedWallet";
import {
  AUTHORIZED_WALLET_TYPE,
  type AuthorizedWalletTypeValue,
} from "../../constants/authorized-wallet";

export class AuthorizedWallet extends GeneratedAuthorizedWallet {
  declare type: AuthorizedWalletTypeValue;

  get isMain(): boolean {
    return this.type === AUTHORIZED_WALLET_TYPE.MAIN;
  }

  get isSeller(): boolean {
    return this.type === AUTHORIZED_WALLET_TYPE.SELLER;
  }

  get isSupply(): boolean {
    return this.type === AUTHORIZED_WALLET_TYPE.SUPPLY;
  }
}
