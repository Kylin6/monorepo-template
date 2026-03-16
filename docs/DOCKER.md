# Docker 配置说明

## 开发模式联调（推荐）

当前配置可直接用于 Docker 开发联调：源码挂载、热重载、依赖在容器内安装。

> 注意：项目里部分实体来自 `typeorm-model-generator` 自动生成。若你重新生成实体，建议随后执行一次
> `npm run db:fix-generated-entities`（用于修复少数 enum 默认值在 MySQL + synchronize 下触发的建表 SQL 问题）。

### 一键启动

在项目根目录执行：

```bash
docker compose up -d
```

- **MySQL**：端口 `33065`，库名/用户/密码见下方「环境变量」
- **Redis**：`6379`
- **NATS**：`4222`（客户端）、`8222`（监控）
- **Backend**：`3000`

应用会等待 MySQL 健康后再启动，首次启动若需执行初始化 SQL，请把脚本放到 `scripts/` 下（MySQL 会自动执行 `*.sql`）。

### 前置条件

1. **`.env` 文件**  
   各应用通过 `env_file: .env` 加载环境变量，请确保项目根目录存在 `.env`。  
   可复制 `.env.template` 并按需修改；Docker 内使用的 MySQL/Redis/NATS 地址已由 compose 的 `environment` 覆盖，无需在 `.env` 里改主机名。

2. **可选：仅启动部分服务**  
   例如只起基础设施 + backend：
   ```bash
   docker compose up -d mysql redis nats backend
   ```

3. **查看日志**  
   ```bash
   docker compose logs -f backend   # 或 worker / telegram-bot / scan-tron
   ```

### 环境变量（compose 已覆盖）

| 变量           | 值（容器内）        |
|----------------|---------------------|
| MYSQL_HOST     | mysql               |
| MYSQL_USER     | trxen-monorepo      |
| MYSQL_PASSWORD | trxen0pspdkba       |
| MYSQL_DB       | trxen-monorepo      |
| REDIS_HOST     | redis               |
| NATS_URL       | nats://nats:4222    |

---

## Dockerfile（生产构建）

各应用 Dockerfile 在对应 `apps/<app>/Dockerfile`，需在 **monorepo 根目录** 构建，例如：

```bash
docker build -f apps/backend/Dockerfile -t backend .
docker build -f apps/work/Dockerfile -t worker .
docker build -f apps/telegram-bot/Dockerfile -t telegram-bot .
docker build -f apps/scan-tron/Dockerfile -t scan-tron .
```

### 生产镜像路径别名说明

当前各应用使用 `tsc` 构建，产物中的 `@database`、`@queue`、`@config` 等路径别名在 Node 中不会自动解析，直接 `node dist/apps/xxx/main.js` 可能报错。

- **建议**：生产部署优先使用 docker-compose 挂载源码 + 开发命令，或在本机用 `npm run start:prod -w <app>`（若已配置 `tsconfig-paths`）。
- **若需独立生产镜像**：可在构建阶段引入 path 重写（如 `tsc-alias`）或使用 NestJS 自带 build，再在镜像中运行生成的 JS。
