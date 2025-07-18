# Vercel Environment Variables Setup Guide

This guide helps you obtain all the required environment variables for Vercel deployment.

## Quick Setup Checklist

- [ ] PostgreSQL Database
- [ ] Redis Cache
- [ ] JWT Secrets
- [ ] S3 Storage
- [ ] Email Service (Resend)
- [ ] Stripe Payment Keys

## Step-by-Step Guide

### 1. Database (PostgreSQL)

#### Option A: Vercel Postgres (Easiest)

1. In Vercel Dashboard → Storage → Create Database
2. Select "Postgres"
3. Vercel automatically adds these variables:
   - `POSTGRES_URL` (we'll use as `DATABASE_URL`)
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

#### Option B: External Database (Supabase, Neon, etc.)

1. Create account at [supabase.com](https://supabase.com) or [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string from dashboard
4. Format: `postgresql://user:password@host:5432/dbname?sslmode=require`

### 2. Redis Cache

#### Recommended: Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create free account
3. Create new Redis database
4. Select region close to your Vercel deployment
5. Copy the "Redis URL" from dashboard
6. Format: `redis://default:password@your-endpoint.upstash.io:6379`

### 3. JWT Secrets

Generate secure random strings (minimum 32 characters):

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32

# Generate INTERNAL_API_KEY
openssl rand -hex 16
```

Or use online generator: https://generate-secret.vercel.app/32

### 4. S3 Storage

#### Option A: AWS S3

1. Create AWS account
2. Go to S3 → Create bucket
3. Create IAM user with S3 access
4. Get credentials:
   - `STORAGE_ACCESS_KEY`: IAM Access Key ID
   - `STORAGE_SECRET_KEY`: IAM Secret Access Key
   - `STORAGE_BUCKET`: Your bucket name
   - `STORAGE_REGION`: e.g., us-east-1

#### Option B: Cloudflare R2 (S3-compatible, no egress fees)

1. Cloudflare Dashboard → R2
2. Create bucket
3. Generate API token
4. Use R2 endpoint: `STORAGE_ENDPOINT=https://[account-id].r2.cloudflarestorage.com`

### 5. Email Service (Resend)

1. Go to [resend.com](https://resend.com)
2. Create free account (100 emails/day free)
3. Add and verify your domain
4. Go to API Keys → Create API Key
5. Copy the key starting with `re_`
6. Set `EMAIL_FROM` to your verified domain email

### 6. Stripe Payments

1. Create account at [stripe.com](https://stripe.com)
2. **API Keys**:
   - Dashboard → Developers → API keys
   - Copy "Secret key" (starts with `sk_live_` for production)
3. **Webhook Secret**:
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-app.vercel.app/payments/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.*`
     - `payment_intent.succeeded`
   - Copy "Signing secret" (starts with `whsec_`)

## Setting Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to your project → Settings → Environment Variables
2. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Your actual value
   - **Environment**: Select all (Production, Preview, Development)
3. Click "Save"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Set variables one by one
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
# ... etc

# Or import from .env file
vercel env add < .env.production
```

### Method 3: Import from .env file

1. Create `.env.production` locally with your values
2. In Vercel Dashboard → Environment Variables
3. Click "Import .env"
4. Paste your file contents
5. Click "Import"

## Environment Variable Template

Create a `.env.production` file locally:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Redis
REDIS_URL=redis://default:password@your-redis.upstash.io:6379

# Auth
JWT_SECRET=your-32-char-secret-from-openssl
JWT_REFRESH_SECRET=another-32-char-secret
INTERNAL_API_KEY=your-hex-api-key

# Storage
STORAGE_TYPE=s3
STORAGE_BUCKET=my-pika-uploads
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Email
RESEND_API_KEY=re_123456789
EMAIL_FROM=noreply@mydomain.com
EMAIL_FROM_NAME=Pika

# Stripe
STRIPE_SECRET_KEY=sk_live_123456789
STRIPE_WEBHOOK_SECRET=whsec_123456789

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

## Verification

After setting all variables:

1. Trigger a new deployment
2. Check function logs for any missing variable errors
3. Test the health endpoint: `https://your-app.vercel.app/health`

## Common Issues

### Missing Variables

- Vercel will show errors in function logs
- Check Settings → Functions → Logs

### Database Connection Issues

- Ensure `?sslmode=require` is in DATABASE_URL
- For Vercel Postgres, use the provided `POSTGRES_URL`

### Redis Connection Issues

- Upstash works best with Vercel
- Ensure Redis URL includes password
- **For serverless environments**: Set `CACHE_DISABLED=true` to use in-memory cache instead

### Email Not Sending

- Verify domain in Resend
- Check API key starts with `re_`

## Cost Estimates

- **Vercel**: Free tier includes 100GB bandwidth
- **Database**: ~$0-25/month (free tiers available)
- **Redis**: Upstash free tier: 10,000 commands/day
- **S3**: ~$0.023/GB stored + bandwidth
- **Email**: Resend free: 100/day, paid: $20/mo for 10k
- **Stripe**: 2.9% + 30¢ per transaction

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use different values** for production vs development
3. **Rotate secrets regularly**
4. **Restrict environment variables** to specific environments
5. **Use Vercel's encrypted secrets** for sensitive values

## Next Steps

After setting all environment variables:

1. Deploy your application
2. Run database migrations:
   ```bash
   npm run db:migrate:prod
   ```
3. Configure Stripe webhooks
4. Test all endpoints
5. Monitor logs for any issues
