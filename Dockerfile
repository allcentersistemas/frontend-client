FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_BUILD_MODE=production
ARG VITE_APP_BASE=/
ENV VITE_APP_BASE=${VITE_APP_BASE}
RUN npm run build -- --mode ${VITE_BUILD_MODE}

FROM nginx:1.27-alpine
ARG NGINX_CONF=config/nginx.static.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
