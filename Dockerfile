## Root helper Dockerfile
# Small helper image for development tasks. Not used for Medusa service container.
FROM node:20-bullseye-slim

WORKDIR /workspace

# Prepare yarn (Corepack) and install deps (fallback safe)
COPY package.json yarn.lock* ./
RUN corepack enable && corepack prepare yarn@stable --activate || true
RUN yarn install --immutable --inline-builds || true

CMD ["/bin/sh"]
