import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
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
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  // 成功响应格式由各控制器基类 BaseController.success() / error() 等统一返回，不再使用全局 TransformInterceptor

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动过滤掉DTO中未定义的属性
      forbidNonWhitelisted: true, // 如果存在未定义的属性，抛出错误
      transform: true, // 自动转换类型
    })
  );

  // Swagger 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Trxen Backend API")
    .setDescription(
      "Trxen 后端接口文档，大部分接口需在 Header 中携带 X-Access-Token 或 Authorization: Bearer &lt;token&gt;"
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "登录后获得的 access token",
      },
      "Bearer"
    )
    .addApiKey(
      { type: "apiKey", name: "X-Access-Token", in: "header" },
      "X-Access-Token"
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document);

  await app.listen(3000);
  console.log("Backend HTTP server started on http://localhost:3000");
  console.log("Swagger docs: http://localhost:3000/api-docs");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Backend bootstrap error", err);
});
