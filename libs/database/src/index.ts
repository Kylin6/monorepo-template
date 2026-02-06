import { DataSource, Repository } from "typeorm";
import { loadConfig } from "@config/index";
import { User } from "./entities/user.entity";
import { AdminUser } from "./entities/entities/AdminUser";

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const cfg = loadConfig();

  dataSource = new DataSource({
    type: "mysql",
    host: cfg.MYSQL_HOST,
    port: cfg.MYSQL_PORT,
    username: cfg.MYSQL_USER,
    password: cfg.MYSQL_PASSWORD,
    database: cfg.MYSQL_DB,
    // Database First: 如有需要可以切换为通配路径
    // entities: [__dirname + '/entities/**/*.entity.{js,ts}'],
    entities: [User, AdminUser],
    synchronize: false,
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

export async function getUserRepository(): Promise<UserRepository> {
  const ds = await getDataSource();
  return ds.getRepository(User);
}

export async function getAdminUserRepository(): Promise<AdminUserRepository> {
  const ds = await getDataSource();
  return ds.getRepository(AdminUser);
}

export { User, AdminUser };
