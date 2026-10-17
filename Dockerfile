# Cocpit frontend (Next.js) — no app code changes; builds and runs exactly like `npm run build` + `npm start`.
# NEXT_PUBLIC_* and INTERNAL_API_URL are baked in at build time — Railway passes service
# variables to the ARGs declared below automatically.
#
# Local build example:
#   docker build -t cocpit-frontend \
#     --build-arg INTERNAL_API_URL=http://backend.railway.internal:5000/api \
#     --build-arg NEXT_PUBLIC_SOCKET_URL=https://<backend-domain> \
#     --build-arg NEXT_PUBLIC_BASE_URL=https://<backend-domain> .

FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG INTERNAL_API_URL
ARG REQUIRE_INTERNAL_API_URL=true
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_SOCKET_TRANSPORT_MODE
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
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

ENV NODE_ENV=production \
    PORT=8080

# next start writes to .next/cache (image optimiser) at runtime
RUN chown -R node:node /app/.next
USER node
EXPOSE 8080
CMD ["npm", "start"]
