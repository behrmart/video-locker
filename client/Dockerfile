# -------- Build Angular --------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Fuerza una salida conocida (dist/app) para evitar las variaciones dist/<app>/browser
RUN npm run build -- --output-path=dist/app

# -------- Nginx --------
FROM nginx:alpine
# quita el default
RUN rm /etc/nginx/conf.d/default.conf

# tu config con proxy /api -> server:3000
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copia el build EXACTO
COPY --from=build /app/dist/app /usr/share/nginx/html

# (opcional) permitir subidas grandes desde el cliente (si manejas uploads directos)
# Si quieres, agrega en nginx.conf: client_max_body_size 2G;
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
