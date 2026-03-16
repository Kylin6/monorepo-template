import { DataSource, Repository } from "typeorm";
import { loadConfig } from "@config/index";
import { Users as User } from "./entities/entities/Users";
import { AdminUser } from "./entities/entities/AdminUser";
import { AuthorizedWallet as AuthorizedWalletEntity } from "./entities/entities/AuthorizedWallet";
import { AuthorizedWallet as AuthorizedWalletModel } from "./entities/models/AuthorizedWallet";
import { TransactionRecords } from "./entities/entities/TransactionRecords";
import { EnergyRecords } from "./entities/entities/EnergyRecords";
import { SysCfg } from "./entities/entities/SysCfg";
import { UniqueId } from "./entities/entities/UniqueId";
import { LeaseRecords } from "./entities/entities/LeaseRecords";
import { Funds } from "./entities/entities/Funds";
import { AddrDesc } from "./entities/entities/AddrDesc";
import { LeasePlan as LeasePlanEntity } from "./entities/entities/LeasePlan";
import { LeaseRecords as LeaseRecordsModel } from "./entities/models/LeaseRecords";
import { ResourcePrice } from "./entities/entities/ResourcePrice";
import { ResourcePriceModel } from "./entities/models/ResourcePrice";
import { RechargeApply } from "./entities/entities/RechargeApply";
import { Agent } from "./entities/entities/Agent";
import { RechargeRecords } from "./entities/entities/RechargeRecords";
import { Exchange } from "./entities/entities/Exchange";
import { PlanLog } from "./entities/entities/PlanLog";
import { PlanTransaction } from "./entities/entities/PlanTransaction";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const cfg = loadConfig();
  const shouldSync =
    process.env.TYPEORM_SYNCHRONIZE === "1" ||
    process.env.TYPEORM_SYNCHRONIZE === "true";

  dataSource = new DataSource({
    type: "mysql",
    host: cfg.MYSQL_HOST,
    port: cfg.MYSQL_PORT,
    username: cfg.MYSQL_USER,
    password: cfg.MYSQL_PASSWORD,
    database: cfg.MYSQL_DB,
    // 使用基于实体类的配置，避免通配路径与打包路径不一致的问题
    entities: [
      User,
      AdminUser,
      AuthorizedWalletEntity,
      TransactionRecords,
      EnergyRecords,
      SysCfg,
      UniqueId,
      LeaseRecords,
      Funds,
      AddrDesc,
      LeasePlanEntity,
      ResourcePrice,
      RechargeApply,
      Agent,
      RechargeRecords,
      PlanLog,
      Exchange,
    PlanTransaction,
    ],
    synchronize: shouldSync,
    logging: false,
  });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}

// ==== Repository helpers ====

export type UserRepository = Repository<User>;
export type AdminUserRepository = Repository<AdminUser>;
// 仓库基于真正的实体类（有 @Entity 装饰器）
export type AuthorizedWalletRepository = Repository<AuthorizedWalletEntity>;
export type TransactionRecordsRepository = Repository<TransactionRecords>;
export type EnergyRecordsRepository = Repository<EnergyRecords>;
export type SysCfgRepository = Repository<SysCfg>;
export type UniqueIdRepository = Repository<UniqueId>;
export type LeaseRecordsRepository = Repository<LeaseRecords>;
export type ResourcePriceRepository = Repository<ResourcePrice>;
export type RechargeApplyRepository = Repository<RechargeApply>;
export type AgentRepository = Repository<Agent>;
export type RechargeRecordsRepository = Repository<RechargeRecords>;
export type ExchangeRepository = Repository<Exchange>;
export async function getUserRepository(): Promise<UserRepository> {
  const ds = await getDataSource();
  return ds.getRepository(User);
}

export async function getAdminUserRepository(): Promise<AdminUserRepository> {
  const ds = await getDataSource();
  return ds.getRepository(AdminUser);
}

export async function getAuthorizedWalletRepository(): Promise<AuthorizedWalletRepository> {
  const ds = await getDataSource();
  return ds.getRepository(AuthorizedWalletEntity);
}

export async function getTransactionRecordsRepository(): Promise<TransactionRecordsRepository> {
  const ds = await getDataSource();
  return ds.getRepository(TransactionRecords);
}

export async function getEnergyRecordsRepository(): Promise<EnergyRecordsRepository> {
  const ds = await getDataSource();
  return ds.getRepository(EnergyRecords);
}

export async function getSysCfgRepository(): Promise<SysCfgRepository> {
  const ds = await getDataSource();
  return ds.getRepository(SysCfg);
}

export async function getUniqueIdRepository(): Promise<UniqueIdRepository> {
  const ds = await getDataSource();
  return ds.getRepository(UniqueId);
}

export async function getLeaseRecordsRepository(): Promise<LeaseRecordsRepository> {
  const ds = await getDataSource();
  return ds.getRepository(LeaseRecords);
}

export async function getResourcePriceRepository(): Promise<ResourcePriceRepository> {
  const ds = await getDataSource();
  return ds.getRepository(ResourcePrice);
}

export async function getRechargeApplyRepository(): Promise<RechargeApplyRepository> {
  const ds = await getDataSource();
  return ds.getRepository(RechargeApply);
}
export async function getAgentRepository(): Promise<AgentRepository> {
  const ds = await getDataSource();
  return ds.getRepository(Agent);
}
export async function getRechargeRecordsRepository(): Promise<RechargeRecordsRepository> {
  const ds = await getDataSource();
  return ds.getRepository(RechargeRecords);
}
export { createUniqueId } from "./helper/unique-id.helper";

export { FundsModel, type LeaseRecordsForFunds } from "./entities/models/Funds";

export {
  PERMISSION_CODE,
  type PermissionCodeKey,
  type PermissionCodeValue,
  getPermissionCodeTexts,
} from "./helper/permission-const.helper";

export {
  FUNDS_TYPE,
  FUNDS_CATE,
  type FundsTypeValue,
  type FundsCateValue,
} from "./constants/funds";

export {
  AUTHORIZED_WALLET_TYPE,
  type AuthorizedWalletTypeValue,
} from "./constants/authorized-wallet";

export {
  LEASE_PLAN_CATE,
  type LeasePlanCateValue,
  LEASE_POOL_STATUS,
  type LeasePoolStatusValue,
  LEASE_PLAN_STATUS,
  type LeasePlanStatusValue,
} from "./constants/lease-plan";

export {
  DELEGATE_QUEUE_KEY,
  RECLAIM_QUEUE_KEY,
  LEASE_RECORDS_STATUS,
  type LeaseRecordsStatusValue,
  LEASE_RECORDS_RECLAIM_TYPE,
  type LeaseRecordsReclaimTypeValue,
  LEASE_RECORDS_SOURCE,
  type LeaseRecordsSourceValue,
} from "./constants/lease-records";

export {
  RECHARGE_APPLY_STATUS,
  RECHARGE_APPLY_CATE,
  type RechargeApplyStatus,
  type RechargeApplyCateValue,
} from "./constants/recharge-apply";

export {
  TRANSACTION_RECORDS_STATUS,
  TRANSACTION_RECORDS_TYPE,
  type TransactionRecordsStatus,
  type TransactionRecordsType,
} from "./constants/transaction-records";

export {
  U2T_EXCHANGE_STATUS,
  type U2TExchangeStatusValue,
} from "./constants/exchange";

export {
  User,
  AdminUser,
  // 对外暴露的实体：用于 TypeORM 查询
  AuthorizedWalletEntity as AuthorizedWallet,
  // 扩展模型：业务方法，按需使用；类型枚举见 AUTHORIZED_WALLET_TYPE
  AuthorizedWalletModel,
  LeasePlanEntity as LeasePlan,
  TransactionRecords,
  EnergyRecords,
  SysCfg,
  UniqueId,
  LeaseRecords,
  LeaseRecordsModel,
  Funds,
  AddrDesc,
  ResourcePrice,
  ResourcePriceModel,
  RechargeApply,
  Agent,
  RechargeRecords,
  Exchange,
  PlanLog,
  PlanTransaction,
};
