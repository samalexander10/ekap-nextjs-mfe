FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js 16 webpack mode needs the preload fix and local webpack env var
ENV NODE_OPTIONS="--require ./webpack-sources-fix.js"
ENV NEXT_PRIVATE_LOCAL_WEBPACK=true
RUN npx next build --webpack

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy the preload script for runtime (dev server / standalone server)
COPY --from=builder /app/webpack-sources-fix.js ./webpack-sources-fix.js
EXPOSE 3000
CMD ["node", "server.js"]
