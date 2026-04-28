FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/telegram-bot/package.json ./apps/telegram-bot/package.json

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
