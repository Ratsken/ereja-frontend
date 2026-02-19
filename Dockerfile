FROM node:22-bullseye-slim

ENV NODE_ENV=development
ENV PATH=/root/.bun/bin:$PATH

WORKDIR /app

# System deps for building some native modules
RUN apt-get update \
  && apt-get install -y curl ca-certificates build-essential python3 make gcc git \
  && rm -rf /var/lib/apt/lists/*

# Install bun (no-login mode) and pm2
RUN curl -fsSL https://bun.sh/install | bash -s -- --no-login || true
RUN npm install -g pm2@latest

# Copy package descriptors and install deps (layer cached)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || true

# Copy project files and perform initial build (optional)
COPY . .
RUN npm run build || true

# Add pm2 ecosystem and entrypoint
COPY ecosystem.config.js /app/ecosystem.config.js
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 9003

CMD ["/app/entrypoint.sh"]
