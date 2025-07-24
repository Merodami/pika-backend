# Pika Deployment Guide

This guide covers deploying the Pika microservices platform to various cloud providers.

## Architecture Overview

Pika uses an extensible deployment adapter pattern that supports multiple platforms:

- **Vercel** (Serverless monolith - all services in one function) ✅ **Ready for deployment**
- **AWS** (Future: ECS/Lambda microservices)
- **Kubernetes** (Future: Container orchestration)
- **Local** (Development mode)

> **🚀 Quick Deploy**: This branch (`task/vercel-bootstrapping`) is ready for Vercel deployment!

## What's New in This Branch

### ✅ Deployment-Ready Features

1. **Deployment Adapter Pattern**: Intelligently combines all microservices into a single Vercel function
2. **Service Auto-Start Fix**: Services only start when run directly, not when imported
3. **Comprehensive Testing**: Service Component Tests following microservices.io patterns
4. **Build Optimizations**: Streamlined build process for Vercel
5. **Health Monitoring**: Built-in health checks for all services and infrastructure

### 🧪 All Tests Pass

- ✅ 757 tests passing
- ✅ Build process verified
- ✅ Linting and formatting complete
- ✅ TypeScript compilation successful

## Vercel Deployment

### Overview

On Vercel, all microservices run as a single serverless function to optimize costs and reduce complexity. The deployment adapter handles:

- Combining all services into one Express app
- Internal routing between services (no network calls)
- Shared infrastructure connections (DB, Redis, S3)
- Automatic scaling and edge deployment

### Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **External Services**:
   - PostgreSQL database (Vercel Postgres, Supabase, or Neon)
   - Redis instance (Upstash Redis recommended)
   - S3-compatible storage (AWS S3 or Vercel Blob Storage)
   - Email service (Resend API key)
   - Stripe account for payments

### Deployment Steps

#### Method 1: Deploy via Vercel Dashboard (Recommended) 🚀

1. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - **Select branch**: `task/vercel-bootstrapping` (this branch is deployment-ready!)
   - **Framework Preset**: Other
   - **Build Command**: `yarn build:vercel`
   - **Output Directory**: (leave empty)
   - **Install Command**: `yarn install`

2. **Continue with Step 3 below for environment setup**

#### Method 2: Deploy via CLI

1. **Fork/Clone the Repository**

   ```bash
   git clone https://github.com/pika/api-microservices.git
   cd api-microservices
   git checkout task/vercel-bootstrapping
   ```

2. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

3. **Set Up External Services**

   **PostgreSQL Database:**
   - Option 1: Vercel Postgres (easiest)
     - Enable in Vercel dashboard
     - Connection string provided automatically
   - Option 2: Supabase/Neon
     - Create database
     - Copy connection string

   **Redis Cache:**
   - Create Upstash Redis instance
   - Copy Redis URL

   **Storage:**
   - Create S3 bucket or enable Vercel Blob Storage
   - Configure access keys

4. **Configure Environment Variables**

   Use `.env.vercel.example` as your guide. Required variables:

   ```bash
   # Database (PostgreSQL)
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

   # Redis Cache (Upstash recommended)
   REDIS_URL=redis://default:pass@redis.upstash.io:6379

   # Authentication (32+ characters)
   JWT_SECRET=your-secure-random-string-here
   JWT_REFRESH_SECRET=another-secure-random-string
   INTERNAL_API_KEY=random-api-key-for-services

   # Storage (S3 or compatible)
   STORAGE_TYPE=s3
   STORAGE_BUCKET=your-bucket
   STORAGE_REGION=us-east-1
   STORAGE_ACCESS_KEY=your-key
   STORAGE_SECRET_KEY=your-secret

   # Email (Resend)
   RESEND_API_KEY=re_your_api_key
   EMAIL_FROM=noreply@yourdomain.com

   # Payments (Stripe)
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Environment
   NODE_ENV=production
   ```

5. **Deploy to Vercel**

   ```bash
   vercel
   ```

   Or connect GitHub repository for automatic deployments.

6. **Run Database Migrations**

   After first deployment, run migrations:

   ```bash
   # Connect to your database and run
   yarn db:migrate:prod
   ```

7. **Configure Stripe Webhooks**

   In Stripe Dashboard:
   - Add webhook endpoint: `https://your-domain.vercel.app/payments/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.*`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Production Considerations

1. **Database Connections**
   - Vercel functions have connection limits
   - Use connection pooling with low pool size (10-20)
   - Consider Prisma Data Proxy for better connection management

2. **Cold Starts**
   - First request after idle will be slower
   - Consider keeping functions warm with cron jobs
   - Optimize bundle size to reduce cold start time

3. **Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking (Sentry/Datadog)
   - Monitor function execution times

4. **Scaling**
   - Vercel auto-scales based on traffic
   - Set appropriate memory limits (3008 MB recommended)
   - Monitor costs as traffic grows

## AWS Deployment (Future)

The deployment adapter is designed to support AWS deployment with minimal changes:

```typescript
// Future AWS adapter usage
const adapter = await createDeploymentAdapter('aws', {
  services: getServiceDefinitions(),
  infrastructure: {
    // AWS-specific config
  },
})
```

### Planned AWS Architecture

- **ECS Fargate**: Container-based microservices
- **API Gateway**: Request routing and rate limiting
- **RDS PostgreSQL**: Managed database
- **ElastiCache Redis**: Managed cache
- **S3**: File storage
- **SES**: Email service

## Local Development

For local development, the adapter runs all services on different ports:

```bash
# Start local services
yarn docker:local    # Start PostgreSQL & Redis
yarn local          # Start all microservices
```

## Environment Variables

### Core Variables

| Variable           | Description                    | Example                               |
| ------------------ | ------------------------------ | ------------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string   | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL`        | Redis connection string        | `redis://default:pass@host:6379`      |
| `JWT_SECRET`       | JWT signing secret (32+ chars) | Random string                         |
| `INTERNAL_API_KEY` | Service-to-service auth        | Random string                         |

### Service URLs (Auto-configured on Vercel)

In Vercel deployment, services communicate internally. No need to configure service URLs.

### Storage Configuration

| Variable             | Description      | Example               |
| -------------------- | ---------------- | --------------------- |
| `STORAGE_TYPE`       | Storage provider | `s3`, `blob`, `minio` |
| `STORAGE_BUCKET`     | Bucket name      | `pikatorage`          |
| `STORAGE_ACCESS_KEY` | S3 access key    | From AWS/provider     |
| `STORAGE_SECRET_KEY` | S3 secret key    | From AWS/provider     |

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Ensure `yarn build:vercel` completes successfully
   - Check that all packages are listed in build command

2. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Check SSL settings (required for production)
   - Ensure database is accessible from Vercel

3. **Redis connection errors**
   - Verify REDIS_URL format
   - Check firewall/security group settings
   - Ensure SSL is enabled for production

4. **Function timeout**
   - Increase `maxDuration` in vercel.json (max 300s for Pro)
   - Optimize database queries
   - Add caching for expensive operations

### Debug Mode

Enable debug logging:

```javascript
// In vercel.json
{
  "env": {
    "DEBUG": "pika",
    "LOG_LEVEL": "debug"
  }
}
```

## Deployment Checklist

- [ ] External services provisioned (DB, Redis, S3)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Stripe webhooks configured
- [ ] Email service verified
- [ ] Health check endpoint working (`/health`)
- [ ] Branch selected: `task/vercel-bootstrapping`

## Quick Test After Deployment

Once deployed, test your endpoints:

```bash
# Health check
curl https://your-app.vercel.app/health

# API Gateway status
curl https://your-app.vercel.app/api/v1/health

# Service-specific health checks
curl https://your-app.vercel.app/auth/health
curl https://your-app.vercel.app/users/health
# etc.
```

## Important Notes

1. **First Deployment**: May take 5-10 minutes due to dependency installation
2. **Cold Starts**: First request after idle may take 2-5 seconds
3. **Database Migrations**: Must be run after deployment (see step 6)
4. **Webhook Configuration**: Required for payment processing
5. **Environment Variables**: All must be set before deployment succeeds

## Need Help?

- Check function logs in Vercel dashboard
- Review error messages in `/health` endpoint
- Ensure all environment variables are set
- Verify external services are accessible
- [ ] API documentation accessible
- [ ] Error tracking configured
- [ ] Monitoring/alerts set up
- [ ] Load testing performed

## Cost Optimization

### Vercel

- Start with Hobby plan for testing
- Monitor function invocations and duration
- Use caching aggressively to reduce compute
- Consider Pro plan for production (longer timeouts, more resources)

### External Services

- **Database**: Start with free tiers (Supabase/Neon)
- **Redis**: Upstash pay-per-request model
- **Storage**: S3 with lifecycle policies
- **Email**: Resend free tier (100 emails/day)

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to git
   - Use Vercel environment variables
   - Rotate keys regularly

2. **API Security**
   - Enable rate limiting
   - Use API keys for service-to-service
   - Implement request validation

3. **Database Security**
   - Use SSL connections
   - Implement row-level security
   - Regular backups

4. **Monitoring**
   - Log security events
   - Monitor failed authentication attempts
   - Set up alerts for anomalies

## Next Steps

After successful deployment:

1. Set up CI/CD pipeline
2. Configure custom domain
3. Enable CDN for static assets
4. Set up staging environment
5. Implement blue-green deployments
