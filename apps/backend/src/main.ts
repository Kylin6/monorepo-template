import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 启用跨域资源共享（CORS）
  app.enableCors({
    origin: configService.get<string>("CORS_ORIGIN", "*"), // 允许的来源，生产环境应该指定具体域名
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true, // 允许携带凭证（cookies等）
    allowedHeaders: ["Content-Type", "Authorization", "X-Access-Token"],
    exposedHeaders: ["X-Access-Token"],
  });
  // 启用全局异常过滤器（统一错误响应格式）
  app.useGlobalFilters(new HttpExceptionFilter());
  // 启用全局响应拦截器（统一成功响应格式）
  app.useGlobalInterceptors(new TransformInterceptor());

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动过滤掉DTO中未定义的属性
      forbidNonWhitelisted: true, // 如果存在未定义的属性，抛出错误
      transform: true, // 自动转换类型
    })
  );
  await app.listen(3000);
  console.log("Backend HTTP server started on http://localhost:3000");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Backend bootstrap error', err);
});

