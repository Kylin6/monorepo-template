import { Module } from "@nestjs/common";
import { DatabaseInitService } from "./database-init.service";
import { RedisService } from "./redis.service";
import { QueueInitService } from "./queue-init.service";

@Module({
  providers: [DatabaseInitService, RedisService, QueueInitService],
  exports: [RedisService],
})
export class InfraModule {}
