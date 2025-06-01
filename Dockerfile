FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json package-lock.json* ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# For Railway deployment
# Copy existing .env.production file if it exists locally
# COPY .env.production .env.production

# For build-time environment variables
# Railway automatically injects environment variables during build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG OPENAI_API_KEY
ARG USERS_JSON

# Create or append to .env.production with build args (for Next.js public vars)
RUN touch .env.production && \
    if [ -n "$NEXT_PUBLIC_API_URL" ]; then \
      echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" >> .env.production; \
    fi && \
    if [ -n "$NEXT_PUBLIC_SITE_URL" ]; then \
      echo "NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL" >> .env.production; \
    fi && \
    if [ -n "$OPENAI_API_KEY" ]; then \
      echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env.production; \
    fi && \
    if [ -n "$USERS_JSON" ]; then \
      echo "USERS_JSON=$USERS_JSON" >> .env.production; \
    fi

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# These variables are not used during build, but are needed at runtime
# Railway will inject these into the container at runtime
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV USERS_JSON=$USERS_JSON
# Add any other runtime environment variables your app needs

# Create a non-root user and set permissions
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package.json for reference
COPY --from=builder /app/package.json ./package.json

# Create necessary directories
RUN mkdir -p public .next/static
RUN chown -R nextjs:nodejs public .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files and config
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

# No need for custom server.js file as we're using next start

# Use the non-root user
USER nextjs

EXPOSE 3000
ENV PORT 3000

# In standalone mode, we need to run the server directly from the .next/standalone directory
CMD ["node", "server.js"]
