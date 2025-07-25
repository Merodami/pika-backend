# Vercel Deployment Guide for Solo60

This guide explains how to deploy the Solo60 platform to Vercel using a hybrid architecture where the API Gateway runs on Vercel as a serverless function and microservices run on traditional hosting.

## Architecture Overview

```
┌─────────────────────────┐     ┌──────────────────────────────────┐
│   Client Applications   │     │        Backend Services          │
│  (Web, Mobile, etc.)    │     │    (Traditional Hosting)         │
└───────────┬─────────────┘     │                                  │
            │                   │  ┌─────────────────────────┐     │
            │ HTTPS             │  │  User Service (5501)    │     │
            ▼                   │  ├─────────────────────────┤     │
┌─────────────────────────┐     │  │  Auth Service (5502)    │     │
│     Vercel Platform     │     │  ├─────────────────────────┤     │
│                         │     │  │  Gym Service (5503)     │     │
│  ┌─────────────────┐    │     │  ├─────────────────────────┤     │
│  │ /api/index.js   │────┼─────┼─▶│  Session Service (5504) │     │
│  │ (API Gateway)   │    │ HTTP│  ├─────────────────────────┤     │
│  └─────────────────┘    │     │  │  Payment Service (5505) │     │
│                         │     │  ├─────────────────────────┤     │
│  Serverless Function    │     │  │  ... other services     │     │
└─────────────────────────┘     │  └─────────────────────────┘     │
                                │                                  │
                                │  ┌─────────────────────────┐     │
                                │  │   PostgreSQL Database   │     │
                                │  ├─────────────────────────┤     │
                                │  │     Redis Cache         │     │
                                │  └─────────────────────────┘     │
                                └──────────────────────────────────┘
```

## Why This Architecture?

1. **API Gateway on Vercel**:
   - Benefits from Vercel's global CDN
   - Auto-scaling and serverless benefits
   - No server management

2. **Microservices on Traditional Hosting**:
   - Need persistent connections (Redis, PostgreSQL)
   - Run background jobs and cron tasks
   - Handle webhooks (Stripe, etc.)
   - Maintain WebSocket connections

## Deployment Steps

### 1. Prepare the Codebase

```bash
# Build the API Gateway
yarn nx run @solo60/api-gateway:build

# Verify the build
ls -la packages/api-gateway/dist/api/
```

### 2. Deploy Backend Services First

Deploy your microservices to a traditional hosting platform:

**Recommended Platforms:**

- Railway.app (Easy monorepo support)
- Render.com (Good for microservices)
- AWS ECS/Fargate
- Google Cloud Run
- DigitalOcean App Platform

**For each service:**

1. Set up PostgreSQL and Redis instances
2. Deploy each service with its required environment variables
3. Note down the public URLs for each service

### 3. Configure Vercel Project

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Link your project
   vercel link
   ```

2. **Set Environment Variables**

   Copy variables from `.env.vercel` to Vercel dashboard:

   ```bash
   # Or use CLI
   vercel env add JWT_SECRET production
   vercel env add USER_API_URL production
   # ... add all required variables
   ```

3. **Deploy to Vercel**

   ```bash
   # Deploy to production
   vercel --prod

   # Or push to main branch if connected to Git
   git push origin main
   ```

## Environment Variables

Critical variables for Vercel deployment:

```env
# Backend Service URLs (MUST be configured)
USER_API_URL=https://your-user-service.example.com
AUTH_API_URL=https://your-auth-service.example.com
GYM_API_URL=https://your-gym-service.example.com
# ... etc for all services

# Security (MUST be configured)
JWT_SECRET=your-production-secret-min-32-chars
SERVICE_API_KEY=your-service-to-service-api-key

# Optional but recommended
REDIS_HOST=your-redis.upstash.io
REDIS_PASSWORD=your-redis-password
```

## Vercel Configuration Details

The `vercel.json` configuration:

```json
{
  "functions": {
    "api/index.js": {
      "runtime": "nodejs22.x",
      "maxDuration": 30,
      "memory": 1024,
      "includeFiles": "packages/api-gateway/dist/**"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

- **Runtime**: Node.js 22.x for latest features
- **Max Duration**: 30 seconds (increase for Pro plan)
- **Memory**: 1024 MB (adjust based on needs)
- **Include Files**: Ensures all API Gateway files are included

## Testing the Deployment

1. **Health Check**

   ```bash
   curl https://your-project.vercel.app/health
   ```

2. **API Documentation**

   ```bash
   open https://your-project.vercel.app/api/v1/docs
   ```

3. **Test API Endpoints**
   ```bash
   # Login
   curl -X POST https://your-project.vercel.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

## Monitoring and Debugging

1. **Vercel Functions Log**

   ```bash
   vercel logs --follow
   ```

2. **Check Function Metrics**
   - Visit Vercel Dashboard → Functions tab
   - Monitor execution time, errors, and invocations

3. **Common Issues**
   - **504 Gateway Timeout**: Increase `maxDuration` or optimize backend response time
   - **500 Internal Error**: Check environment variables and backend service connectivity
   - **CORS Issues**: Update `CORS_ORIGIN` environment variable

## Production Considerations

1. **Security**
   - Use strong JWT secrets
   - Enable rate limiting
   - Configure CORS properly
   - Use HTTPS for all backend services

2. **Performance**
   - Enable Redis caching
   - Use CDN for static assets
   - Optimize cold starts by keeping functions warm

3. **Scaling**
   - Backend services should auto-scale
   - Database connection pooling is critical
   - Monitor Vercel function limits

## Cost Optimization

1. **Vercel Costs**
   - Free tier: 100GB bandwidth, 100k function invocations
   - Monitor usage in Vercel dashboard
   - Use caching to reduce invocations

2. **Backend Costs**
   - Choose hosting based on expected load
   - Use managed databases for easier scaling
   - Consider serverless databases (Neon, PlanetScale)

## Rollback Strategy

1. **Vercel Rollback**

   ```bash
   # List deployments
   vercel ls

   # Rollback to previous
   vercel rollback [deployment-url]
   ```

2. **Backend Services**
   - Maintain versioned deployments
   - Use blue-green deployments
   - Keep database migrations reversible

## Next Steps

1. Set up monitoring (Datadog, New Relic)
2. Configure alerts for errors and performance
3. Implement CI/CD pipeline
4. Set up staging environment
5. Configure custom domain

## Support

For issues specific to:

- **Vercel deployment**: Check Vercel docs or support
- **API Gateway**: Review `/packages/api-gateway/README.md`
- **Microservices**: Check individual service documentation
