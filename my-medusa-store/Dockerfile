### Multi-stage Dockerfile for Medusa backend
### Builder stage: install dependencies and build artifacts
FROM node:20-bullseye-slim AS builder
WORKDIR /usr/src/app

# Install minimal build tools needed for native modules (e.g. @swc/core)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install deps
COPY package.json yarn.lock* ./
RUN corepack enable && corepack prepare yarn@stable --activate
# Force rebuild of native modules for Linux platform
RUN yarn install --immutable --inline-builds

# Copy source and build
COPY . .
RUN yarn build || true

### Runtime stage: smaller image with only runtime files
FROM node:20-bullseye-slim AS runner
WORKDIR /usr/src/app

# Ensure CA certs are present
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy built app and node_modules from builder
COPY --from=builder /usr/src/app /usr/src/app

# Ensure Corepack/Yarn 4 is available in the runtime image (package.json specifies yarn@4.x)
RUN corepack enable && corepack prepare yarn@4.9.1 --activate || true

EXPOSE 9000

# Run production server (serves pre-built admin UI without Vite dev server)
CMD ["yarn", "start"]

