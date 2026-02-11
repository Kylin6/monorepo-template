import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseInitService } from "./database-init.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { AccessTokenMiddleware } from "./auth/access-token.middleware";
import { OperationLogModule } from "./common/operation-log.module";
import { ErrorLoggerService } from "./common/error-logger.service";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    OperationLogModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseInitService,
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
