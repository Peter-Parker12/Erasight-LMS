FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci runs the postinstall hook (`prisma generate`), which needs the
# schema present — copy it in before installing, not after.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Used only by the one-shot `migrate` compose service. Keeps the full
# node_modules (prisma CLI + its own dependency tree) rather than trying to
# cherry-pick prisma's runtime deps into the trimmed `runner` image below.
# Also runs the initial-admin bootstrap script right after migrating, so a
# single `docker compose up` leaves you with a working ADMIN account with no
# manual step (see scripts/bootstrap-admin.mjs).
FROM node:22-alpine AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts ./scripts
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/bootstrap-admin.mjs"]

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Keeps Server Function closures decryptable across rebuilds/redeploys.
# See: https://nextjs.org/docs/app/guides/self-hosting#server-functions-encryption-key
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
