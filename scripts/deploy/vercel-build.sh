#!/bin/bash
# Vercel Build and Deployment Script
# This script handles the complete build process for Vercel deployments

set -e  # Exit on error

echo "🚀 Starting Vercel build process..."
echo "Environment: ${NODE_ENV:-development}"

# 1. Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
yarn db:generate

# 2. Run database migrations
# Run migrations if DATABASE_URL is set (we're in Vercel if this script is running from build:vercel)
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️  Step 2: Running database migrations..."
  cd packages/database
  npx prisma migrate deploy
  MIGRATION_EXIT_CODE=$?
  cd ../..
  
  if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Migrations deployed successfully"
  else
    echo "❌ Migration failed with exit code $MIGRATION_EXIT_CODE"
    echo "Continuing build anyway for now..."
    # Uncomment to fail the build on migration error:
    # exit $MIGRATION_EXIT_CODE
  fi
else
  echo "⏭️  Step 2: Skipping migrations (DATABASE_URL not set)"
fi

# 3. Build all packages
echo "🔨 Step 3: Building all packages..."
npx nx run-many \
  --target=build \
  --projects=@pika/types,@pika/environment,@pika/api,@pika/sdk,@pika/shared,@pika/database,@pika/redis,@pika/http,@pika/deployment,@pika/api-gateway,@pika/auth,@pika/user,@pika/payment,@pika/subscription,@pika/communication,@pika/support,@pika/storage,@pika/business,@pika/category,@pika/voucher-service,@pika/pdf \
  --parallel=100 \
  --output-style=stream

echo "✅ Build completed successfully!"