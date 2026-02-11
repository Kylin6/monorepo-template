import { Global, Module } from "@nestjs/common";
import { OperationLoggerService } from "./operation-logger.service";
import { OPERATION_LOGGER } from "@common/index";

/**
 * 操作日志模块：全局提供 OPERATION_LOGGER，供所有继承 BaseController 的控制器注入
 */
@Global()
@Module({
  providers: [
    OperationLoggerService,
    { provide: OPERATION_LOGGER, useExisting: OperationLoggerService },
  ],
  exports: [OPERATION_LOGGER],
})
export class OperationLogModule {}
