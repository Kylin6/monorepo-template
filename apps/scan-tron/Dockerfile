FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/scan-tron/package.json ./apps/scan-tron/package.json
COPY libs/config/package.json ./libs/config/package.json
COPY libs/redis/package.json ./libs/redis/package.json
COPY libs/common/package.json ./libs/common/package.json

RUN npm install

COPY tsconfig*.json ./
COPY apps/scan-tron ./apps/scan-tron
COPY libs ./libs

RUN npm run build -w scan-tron

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/apps/scan-tron/package.json ./apps/scan-tron/package.json
COPY --from=base /app/dist ./dist

CMD ["node", "dist/apps/scan-tron/main.js"]
