import { Global, Module } from "@nestjs/common";
import { QUEUE_SENDER } from "@common/index";
import { QueueSenderService } from "./queue-sender.service";

@Global()
@Module({
  providers: [
    QueueSenderService,
    { provide: QUEUE_SENDER, useExisting: QueueSenderService },
  ],
  exports: [QueueSenderService, QUEUE_SENDER],
})
export class QueueModule {}
