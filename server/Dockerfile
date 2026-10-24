# Production Dockerfile for Bliss Backend (Arm64 / VM 3 & VM 4)
FROM node:22-alpine

WORKDIR /app

# Install build tools if needed for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "src/server.js"]
