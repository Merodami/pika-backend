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
# Use MIGRATION_DATABASE_URL for migrations (direct connection required for schema changes)
if [ -n "$MIGRATION_DATABASE_URL" ]; then
  echo "🗄️  Step 2: Running database migrations..."
  cd packages/database

  # Use MIGRATION_DATABASE_URL for migrations (bypasses connection pooler)
  DATABASE_URL="$MIGRATION_DATABASE_URL" npx prisma migrate deploy

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
elif [ -n "$DATABASE_URL" ]; then
  echo "⚠️  Step 2: MIGRATION_DATABASE_URL not set, attempting with DATABASE_URL..."
  echo "Note: This may fail if using a connection pooler. Set MIGRATION_DATABASE_URL for reliable migrations."
  cd packages/database
  npx prisma migrate deploy
  MIGRATION_EXIT_CODE=$?
  cd ../..

  if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Migrations deployed successfully"
  else
    echo "❌ Migration failed - likely needs direct connection (MIGRATION_DATABASE_URL)"
  fi
else
  echo "⏭️  Step 2: Skipping migrations (no database connection available)"
fi

# 3. Build all packages
echo "🔨 Step 3: Building all packages..."
npx nx run-many \
  --target=build \
  --projects=@pika/types,@pika/environment,@pika/api,@pika/sdk,@pika/shared,@pika/database,@pika/redis,@pika/http,@pika/deployment,@pika/api-gateway,@pika/auth,@pika/user,@pika/payment,@pika/subscription,@pika/communication,@pika/support,@pika/storage,@pika/business,@pika/category,@pika/voucher-service,@pika/pdf \
  --parallel=100 \
  --output-style=stream

echo "✅ Build completed successfully!"