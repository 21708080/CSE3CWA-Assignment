FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

RUN ./node_modules/.bin/prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]
