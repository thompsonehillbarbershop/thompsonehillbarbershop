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

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY .env ./

# Expõe a porta padrão do Nest (ajuste conforme necessário)
EXPOSE 3333

CMD ["npm", "run", "start:prod"]
