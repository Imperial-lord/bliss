# Production Dockerfile for Bliss Backend (glibc / Debian slim)
FROM node:22-bookworm-slim

WORKDIR /app

# Install build tools if needed for native modules
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "src/server.js"]
