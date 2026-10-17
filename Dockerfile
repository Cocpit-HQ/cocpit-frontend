# Cocpit frontend (Next.js standalone)
# NEXT_PUBLIC_* and INTERNAL_API_URL are baked in at build time — pass them as build args.
# Railway passes service variables to declared ARGs automatically.
#
#   docker build -t cocpit-frontend \
#     --build-arg INTERNAL_API_URL=http://backend.railway.internal:8080/api \
#     --build-arg NEXT_PUBLIC_SOCKET_URL=https://<backend-domain> ... .

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG INTERNAL_API_URL
ARG REQUIRE_INTERNAL_API_URL=true
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_SOCKET_TRANSPORT_MODE=websocket
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_APPLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG IMAGE_REMOTE_HOSTS

ENV INTERNAL_API_URL=$INTERNAL_API_URL \
    REQUIRE_INTERNAL_API_URL=$REQUIRE_INTERNAL_API_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_SOCKET_TRANSPORT_MODE=$NEXT_PUBLIC_SOCKET_TRANSPORT_MODE \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_APPLE_CLIENT_ID=$NEXT_PUBLIC_APPLE_CLIENT_ID \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    IMAGE_REMOTE_HOSTS=$IMAGE_REMOTE_HOSTS \
    NEXT_OUTPUT_STANDALONE=true \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=::

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 8080
CMD ["node", "server.js"]
