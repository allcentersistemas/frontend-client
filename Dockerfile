FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_BUILD_MODE=production
RUN npm run build -- --mode ${VITE_BUILD_MODE} \
    && mkdir -p /app/out/portal \
    && cp -a /app/dist/. /app/out/portal/

FROM nginx:1.27-alpine
ARG NGINX_CONF=config/nginx.static.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
