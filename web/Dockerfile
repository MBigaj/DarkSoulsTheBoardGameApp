# syntax=docker/dockerfile:1
# Stages: deps → dev (Vite + HMR) · build (static bundle) → runtime (nginx, non-root)

FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# --- dev: used by `docker compose up --watch`; source arrives via Compose Watch sync
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- build: production bundle in /app/dist
FROM deps AS build
ARG VITE_API_MODE=mock
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_MODE=$VITE_API_MODE \
    VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm run build

# --- runtime: nginx serves dist/ and proxies /api/v1 to the api service
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
