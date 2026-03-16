FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/telegram-bot/package.json ./apps/telegram-bot/package.json
COPY libs/config/package.json ./libs/config/package.json
COPY libs/database/package.json ./libs/database/package.json
COPY libs/redis/package.json ./libs/redis/package.json
COPY libs/queue/package.json ./libs/queue/package.json
COPY libs/common/package.json ./libs/common/package.json

RUN npm install

COPY tsconfig*.json ./
COPY apps/telegram-bot ./apps/telegram-bot
COPY libs ./libs

RUN npm run build -w telegram-bot

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/apps/telegram-bot/package.json ./apps/telegram-bot/package.json
COPY --from=base /app/dist ./dist

CMD ["node", "dist/apps/telegram-bot/main.js"]
