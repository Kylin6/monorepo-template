import { Module } from "@nestjs/common";

/**
 * 通用模块（可选导入，当前主要使用 OperationLogModule）
 */
@Module({
  controllers: [],
})
export class CommonModule {}
