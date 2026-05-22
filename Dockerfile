FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_BUILD_MODE=production
ARG VITE_APP_BASE=/
ENV VITE_APP_BASE=${VITE_APP_BASE}
RUN npm run build -- --mode ${VITE_BUILD_MODE}

# Coloca el build en la ruta que nginx sirve según VITE_APP_BASE (/ o /portal/)
RUN set -eux; \
  base="${VITE_APP_BASE:-/}"; \
  mkdir -p /app/out; \
  case "$base" in \
    /|"") cp -a /app/dist/. /app/out/ ;; \
    *) \
      sub="${base#/}"; \
      sub="${sub%/}"; \
      mkdir -p "/app/out/${sub}"; \
      cp -a /app/dist/. "/app/out/${sub}/"; \
      ;; \
  esac

FROM nginx:1.27-alpine
ARG NGINX_CONF=config/nginx.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
