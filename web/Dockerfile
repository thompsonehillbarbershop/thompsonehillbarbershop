# Etapa 1: build da aplicação
FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: execução da aplicação
FROM node:22 AS production

WORKDIR /app

# Copia apenas arquivos necessários
COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/.env ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

# Expõe a porta padrão do Nest (ajuste conforme necessário)
EXPOSE 3000

CMD ["npm", "run", "start"]
