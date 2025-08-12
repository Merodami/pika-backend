#!/bin/bash
# Vercel Post-Build Script
# This script runs after the main build for additional setup tasks

set -e  # Exit on error

echo "🎯 Starting post-build tasks..."

# 1. Create test users (only for staging/preview environments)
if [ "$VERCEL_ENV" = "preview" ] || [ "$VERCEL_ENV" = "development" ]; then
  echo "👥 Creating test users for non-production environment..."
  
  # Check if setup-test-users script exists
  if [ -f "scripts/flows/setup-test-users.ts" ]; then
    npx tsx scripts/flows/setup-test-users.ts || {
      echo "⚠️  Warning: Test user creation failed, continuing..."
    }
  else
    echo "⚠️  Test user setup script not found, skipping..."
  fi
fi

# 2. Run any seed data (optional)
if [ "$RUN_SEED" = "true" ] && [ "$VERCEL_ENV" != "production" ]; then
  echo "🌱 Seeding database..."
  yarn db:seed || {
    echo "⚠️  Warning: Database seeding failed, continuing..."
  }
fi

# 3. Validate deployment
if [ -f "scripts/validate-deployment.sh" ]; then
  echo "✔️  Validating deployment..."
  ./scripts/validate-deployment.sh || {
    echo "⚠️  Warning: Deployment validation had issues"
  }
fi

echo "✅ Post-build tasks completed!"