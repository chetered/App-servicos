# SERVIX Backend — Multi-stage Dockerfile
FROM node:20-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

# ============================================================
# Development stage
# ============================================================
FROM base AS development

RUN npm ci
COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ============================================================
# Build stage
# ============================================================
FROM base AS builder

RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ============================================================
# Production stage
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]
