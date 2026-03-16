import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import {
  User,
  AdminUser,
  AuthorizedWallet,
  TransactionRecords,
  EnergyRecords,
  SysCfg,
  UniqueId,
  LeaseRecords,
  Funds,
  AddrDesc,
  ResourcePrice,
  RechargeRecords,
  LeasePlan,
  Exchange,
  PlanLog,
} from "@database/index";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { CodeTextModule } from "./codeText/codeText.module";
import { SysCfgModule } from "./sysCfg/sysCfg.module";
import { EnergyRecordsModule } from "./energyRecords/energyRecords.module";
import { FundsModule } from "./funds/fund.module";
import { AccessTokenMiddleware } from "./auth/access-token.middleware";
import { OperationLogModule } from "./common/operation-log.module";
import { ErrorLoggerService } from "./common/error-logger.service";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { QueueModule } from "./queue/queue.module";
import { AddrDescModule } from "./addrDesc/addrDesc.module";
import { RechargeRecordsModule } from "./rechargeRecords/rechargeRecords.module";
import { AuthorizedWalletModule } from "./AuthorizedWallet/authorizedWallet.module";
import { TransactionRecordsModule } from "./transactionRecords/transactionRecords.module";
import { LeasePlanModule } from "./leasePlans/leasePlan.module";
import { LeaseRecordModule } from "./leaseRecords/leaseRecord.module";
import { ExchangeModule } from "./exchage/exchage.module";
import { ResourcePriceModule } from "./resourcePrice/resourcePrice.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: "mysql",
        host: config.get<string>("MYSQL_HOST", "localhost"),
        port: Number(config.get<string>("MYSQL_PORT") ?? 3306),
        username: config.get<string>("MYSQL_USER", "root"),
        password: config.get<string>("MYSQL_PASSWORD", "password"),
        database: config.get<string>("MYSQL_DB", "app"),
        entities: [
          User,
          AdminUser,
          AuthorizedWallet,
          TransactionRecords,
          EnergyRecords,
          SysCfg,
          UniqueId,
          LeaseRecords,
          Funds,
          AddrDesc,
          ResourcePrice,
          RechargeRecords,
          LeasePlan,
          Exchange,
          PlanLog,
        ],
        synchronize:
          process.env.TYPEORM_SYNCHRONIZE === "1" ||
          process.env.TYPEORM_SYNCHRONIZE === "true",
        logging: false,
      }),
      inject: [ConfigService],
    }),
    OperationLogModule,
    QueueModule,
    UsersModule,
    AuthModule,
    CodeTextModule,
    SysCfgModule,
    EnergyRecordsModule,
    FundsModule,
    AddrDescModule,
    RechargeRecordsModule,
    AuthorizedWalletModule,
    TransactionRecordsModule,
    LeasePlanModule,
    LeaseRecordModule,
    ExchangeModule,
    ResourcePriceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AccessTokenMiddleware,
    ErrorLoggerService,
    HttpExceptionFilter,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenMiddleware)
      .exclude(
        // 登录与验证码接口不需要 token
        { path: "auth/captcha", method: RequestMethod.ALL },
        { path: "auth/login", method: RequestMethod.ALL },
        { path: "auth/verify-google-auth", method: RequestMethod.ALL },
        // 队列测试接口允许匿名调用，方便联调 backend ↔ worker
        { path: "enqueue", method: RequestMethod.ALL }
      )
      // 其余路由默认都需要 token，如果只想保护部分路由，可以改成具体 path
      .forRoutes("*");
  }
}
