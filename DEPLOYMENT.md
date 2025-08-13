# Pika Backend Deployment Guide

## Overview

This guide covers deploying the Pika backend to Vercel.

## Prerequisites

- Node.js 22+
- Yarn 4.x
- Vercel CLI (`npm install -g vercel`)
- Vercel account with project configured

## Environment Variables

The following environment variables must be configured in Vercel:

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string (Supabase)
- `REDIS_URL` - Redis connection string (Upstash Redis recommended)
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing
- `INTERNAL_API_KEY` - API key for internal service communication

### Optional Variables

- `STRIPE_SECRET_KEY` - Stripe API key for payments
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `RESEND_API_KEY` - Resend API key for email
- `AWS_S3_*` - S3 configuration for file storage

## Deployment Process

### 1. Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Link to Vercel project
vercel link

# Pull environment variables
vercel env pull
```

### 2. Local Testing

```bash
# Validate deployment readiness
./scripts/validate-deployment.sh

# Test build process
yarn build:vercel

# Test locally with Vercel
vercel dev
```

### 3. Deploy to Preview

```bash
# Deploy to preview environment
vercel

# Deploy to specific alias
vercel --alias=preview
```

### 4. Deploy to Production

```bash
# Deploy to production
vercel --prod
```

## Database Migrations

Migrations run automatically during the build process for preview and production deployments.

To run migrations manually:

```bash
# Connect to Vercel
vercel env pull

# Run migrations
cd packages/database
npx prisma migrate deploy
```

## Build Process

The build process (`scripts/deploy/vercel-build.sh`) performs:

1. Generate Prisma Client
2. Run database migrations (preview/production only)
3. Build all packages with NX
4. Package for Vercel deployment

## Monitoring Deployment

### GitHub Actions

Pull requests trigger automatic preview deployments via GitHub Actions:

- Validates deployment configuration
- Builds and deploys to Vercel preview
- Runs smoke tests
- Comments on PR with deployment URL

### Vercel Dashboard

Monitor deployments at: https://vercel.com/dashboard

### Health Checks

Test deployment health:

```bash
# Check API Gateway
curl https://your-deployment.vercel.app/health

# Check services
curl https://your-deployment.vercel.app/auth/health
curl https://your-deployment.vercel.app/users/health
```

## Troubleshooting

### Build Failures

1. Check environment variables are set in Vercel
2. Verify database connection string is correct
3. Check build logs in Vercel dashboard

### Migration Failures

1. Ensure DATABASE_URL is set correctly
2. Check database is accessible from Vercel
3. Review migration logs in build output

### Runtime Errors

1. Check function logs in Vercel dashboard
2. Verify all required environment variables are set
3. Test locally with `vercel dev`

## Rollback

To rollback a deployment:

1. Go to Vercel dashboard
2. Navigate to deployments
3. Find previous working deployment
4. Click "Promote to Production"

## Support

For deployment issues:

- Check build logs in Vercel dashboard
- Review GitHub Actions logs for PR deployments
- Contact team for infrastructure access
