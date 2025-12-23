# ================================================
# Dockerfile untuk Scan Tunai Backend
# Optimized for AWS ECS / EC2 deployment
# ================================================

FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# ================================================
# Dependencies stage
# ================================================
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ================================================
# Build stage (for any build steps)
# ================================================
FROM base AS builder

COPY package*.json ./
RUN npm ci

COPY . .

# ================================================
# Production stage
# ================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Create uploads directory
RUN mkdir -p uploads && chown -R appuser:nodejs uploads

# Set ownership
RUN chown -R appuser:nodejs /app

USER appuser

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
