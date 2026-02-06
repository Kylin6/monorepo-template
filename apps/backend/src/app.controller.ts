import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post('enqueue')
  enqueue(@Body() body: Record<string, unknown>) {
    return this.appService.enqueueExampleJob(body ?? {});
  }
}

