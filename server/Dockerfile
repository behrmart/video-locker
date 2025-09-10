FROM node:20-alpine
RUN apk add --no-cache bash openssl
WORKDIR /app

# deps primero para cache correcto
COPY package*.json ./
RUN npm ci

# prisma primero para generar client
COPY prisma ./prisma
RUN npx prisma generate

# ⬇️ copiar TODO el server
COPY . .

# compilar TS → JS
RUN npm run build

# entrypoint (el que te pasé ayer)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]

