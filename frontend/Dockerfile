# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Baked in at build time. Override with --build-arg for a different backend URL.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------- Serve stage ----------
FROM nginx:1.27-alpine

RUN apk add --no-cache curl \
    && addgroup -S appgroup && adduser -S appuser -G appgroup \
    && touch /var/run/nginx.pid \
    && chown -R appuser:appgroup /var/run/nginx.pid /var/cache/nginx /etc/nginx

COPY --from=build --chown=appuser:appgroup /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER appuser
EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
