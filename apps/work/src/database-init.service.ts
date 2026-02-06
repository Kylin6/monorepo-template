import { Injectable, OnModuleInit } from '@nestjs/common';
import { getDataSource } from '@database/index';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  async onModuleInit() {
    // Worker 启动时初始化数据库连接
    await getDataSource();
  }
}

