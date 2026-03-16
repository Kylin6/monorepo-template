import { Injectable, OnModuleInit } from "@nestjs/common";
import { getDataSource } from "@database/index";

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  async onModuleInit() {
    try {
      await getDataSource();
      // eslint-disable-next-line no-console
      console.log("Telegram bot database connected");
    } catch (err) {
      // 在某些受限运行环境（如沙箱）下，可能无法连接本地 DB；
      // 这里不阻塞 bot 启动，后续真正用到 DB 时再报错即可。
      // eslint-disable-next-line no-console
      console.error("Telegram bot database connect failed", err);
    }
  }
}
