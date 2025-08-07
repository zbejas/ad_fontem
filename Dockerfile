# Use the official Bun image as the base
FROM oven/bun:1.1-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
FROM base AS install
COPY . /app/
WORKDIR /app
RUN bun install

# Start the application
CMD ["bun", "run", "start"]
