FROM node:20-alpine AS base

WORKDIR /app

# 先只复制 package 清单，利用 npm workspaces 安装依赖
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY libs/config/package.json ./libs/config/package.json
COPY libs/database/package.json ./libs/database/package.json
COPY libs/redis/package.json ./libs/redis/package.json
COPY libs/queue/package.json ./libs/queue/package.json
COPY libs/common/package.json ./libs/common/package.json

RUN npm install

# 复制源码并构建 backend
COPY tsconfig*.json ./
COPY apps ./apps
COPY libs ./libs

RUN npm run build -w backend

# 运行镜像
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# 复制依赖和构建产物
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=base /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/apps/backend/main.js"]

