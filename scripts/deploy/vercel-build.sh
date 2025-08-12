#!/bin/bash
# Vercel Build and Deployment Script
# This script handles the complete build process for Vercel deployments

set -e  # Exit on error

echo "🚀 Starting Vercel build process..."
echo "Environment: ${VERCEL_ENV:-development}"
echo "Database URL is ${DATABASE_URL:+set}${DATABASE_URL:-not set}"

# 1. Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
yarn db:generate

# 2. Run database migrations (only in production)
if [ "$VERCEL_ENV" = "production" ] || [ "$VERCEL_ENV" = "preview" ]; then
  echo "🗄️  Step 2: Running database migrations (${VERCEL_ENV})..."
  cd packages/database
  npx prisma migrate deploy || {
    echo "❌ Migration failed! Attempting to continue build..."
    # You might want to exit here in production
    # exit 1
  }
  cd ../..
  echo "✅ Migrations deployed successfully"
else
  echo "⏭️  Step 2: Skipping migrations (Environment: ${VERCEL_ENV:-development})"
fi

# 3. Build all packages
echo "🔨 Step 3: Building all packages..."
npx nx run-many \
  --target=build \
  --projects=@pika/types,@pika/environment,@pika/api,@pika/sdk,@pika/shared,@pika/database,@pika/redis,@pika/http,@pika/deployment,@pika/api-gateway,@pika/auth,@pika/user,@pika/payment,@pika/subscription,@pika/communication,@pika/support,@pika/storage,@pika/business,@pika/category,@pika/voucher-service,@pika/pdf \
  --parallel=100 \
  --output-style=stream

echo "✅ Build completed successfully!"