# Environment Package

Centralized environment variable management and configuration for the Pika platform, providing type-safe access to all environment settings.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/environment:build

# Test configuration
yarn nx run @pikant:test
```

## 📋 Overview

The Environment package manages all configuration and environment variables for the Pika platform:

- **Type-Safe Configuration**: TypeScript interfaces for all environment variables
- **Validation**: Runtime validation of required configuration
- **Default Values**: Sensible defaults for development
- **Environment Loading**: Automatic .env file loading
- **Service Configuration**: Pre-configured settings for all services
- **Feature Flags**: Environment-based feature toggles

## 🏗️ Architecture

```
src/
├── constants/             # Configuration constants
│   ├── apiGateway.ts     # API Gateway settings
│   ├── apiUrls.ts        # Service URL configuration
│   ├── appInfo.ts        # Application metadata
│   ├── auth.ts           # Authentication settings
│   ├── aws.ts            # AWS configuration
│   ├── communication.ts  # Communication settings
│   ├── database.ts       # Database configuration
│   ├── email.ts          # Email provider settings
│   ├── features.ts       # Feature flags
│   ├── geolocation.ts    # Location services
│   ├── healthCheck.ts    # Health check settings
│   ├── monitoring.ts     # Monitoring configuration
│   ├── node.ts           # Node.js settings
│   ├── pagination.ts     # Pagination defaults
│   ├── rateLimiting.ts   # Rate limiting settings
│   ├── redis.ts          # Redis configuration
│   ├── seed.ts           # Database seeding
│   ├── service.ts        # Service configuration
│   ├── stripe.ts         # Payment processing
│   └── testIds.ts        # Test user IDs
├── getEnvVariable.ts      # Environment variable getter
├── loadEnv.ts            # Environment file loader
├── parsers.ts            # Type parsers and validators
├── version.ts            # Version information
└── index.ts              # Package exports
```

## 🔧 Usage

### Basic Configuration Access

```typescript
import { DATABASE_CONFIG, REDIS_CONFIG, AUTH_CONFIG, SERVICE_PORTS } from '@pikant'

// Database configuration
const dbUrl = DATABASE_CONFIG.url
const dbPoolSize = DATABASE_CONFIG.connectionLimit

// Redis configuration
const redisHost = REDIS_CONFIG.host
const redisPort = REDIS_CONFIG.port

// Service ports
const userServicePort = SERVICE_PORTS.USER_SERVICE
const authServicePort = SERVICE_PORTS.AUTH_SERVICE
```

### Environment Variable Validation

```typescript
import { getEnvVariable } from '@pikant'

// Required environment variable
const jwtSecret = getEnvVariable('JWT_SECRET')

// Optional with default
const logLevel = getEnvVariable('LOG_LEVEL', 'info')

// Parsed as number
const port = parseInt(getEnvVariable('PORT', '3000'))

// Parsed as boolean
const debugMode = getEnvVariable('DEBUG', 'false') === 'true'
```

### Feature Flags

```typescript
import { FEATURE_FLAGS } from '@pikant'

if (FEATURE_FLAGS.SOCIAL_FEATURES_ENABLED) {
  // Enable social functionality
}

if (FEATURE_FLAGS.PAYMENT_PROCESSING_ENABLED) {
  // Enable payment features
}
```

## 📊 Configuration Categories

### Core Application

```typescript
export const APP_CONFIG = {
  name: getEnvVariable('APP_NAME', 'Pika'),
  version: getEnvVariable('APP_VERSION', '1.0.0'),
  environment: getEnvVariable('NODE_ENV', 'development'),
  port: parseInt(getEnvVariable('PORT', '3000')),
  host: getEnvVariable('HOST', '0.0.0.0'),
}
```

### Database Configuration

```typescript
export const DATABASE_CONFIG = {
  url: getEnvVariable('DATABASE_URL'),
  schema: getEnvVariable('DATABASE_SCHEMA', 'public'),
  connectionLimit: parseInt(getEnvVariable('DATABASE_CONNECTION_LIMIT', '20')),
  poolTimeout: parseInt(getEnvVariable('DATABASE_POOL_TIMEOUT', '20000')),
  logging: getEnvVariable('DATABASE_LOGGING', 'false') === 'true',
}
```

### Service URLs

```typescript
export const SERVICE_URLS = {
  AUTH_SERVICE: getEnvVariable('AUTH_SERVICE_URL', 'http://localhost:5502'),
  USER_SERVICE: getEnvVariable('USER_SERVICE_URL', 'http://localhost:5501'),
  GYM_SERVICE: getEnvVariable('GYM_SERVICE_URL', 'http://localhost:5503'),
  SESSION_SERVICE: getEnvVariable('SESSION_SERVICE_URL', 'http://localhost:5504'),
  PAYMENT_SERVICE: getEnvVariable('PAYMENT_SERVICE_URL', 'http://localhost:5505'),
}
```

## 🧪 Testing

```bash
# Run configuration tests
yarn nx run @pikant:test

# Test environment loading
yarn test --grep "environment"

# Validate required variables
yarn test --grep "validation"
```

## 🔧 Environment Files

### Development (.env.local)

```bash
# Application
NODE_ENV=development
APP_NAME=Pika
PORT=5500

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:6436/pika
DATABASE_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=7381

# Authentication
JWT_SECRET=your-development-secret
JWT_EXPIRES_IN=15m
```

### Production (.env)

```bash
# Application
NODE_ENV=production
APP_NAME=Pika
PORT=5500

# Database
DATABASE_URL=${DATABASE_URL}
DATABASE_CONNECTION_LIMIT=50

# Redis
REDIS_URL=${REDIS_URL}

# Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m
```

## 🚨 Validation & Error Handling

```typescript
// Automatic validation on import
try {
  const config = await import('@pikant')
  console.log('✅ Configuration loaded successfully')
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message)
  process.exit(1)
}

// Manual validation
import { validateEnvironment } from '@pikant'

const validationResult = validateEnvironment()
if (!validationResult.isValid) {
  console.error('Missing required environment variables:', validationResult.missing)
}
```

## 📊 Configuration Reference

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `REDIS_HOST` - Redis server host

### Optional Variables (with defaults)

- `NODE_ENV` - Environment (development)
- `PORT` - Server port (5500)
- `LOG_LEVEL` - Logging level (info)
- `REDIS_PORT` - Redis port (6379)

### Service-Specific Variables

- `STRIPE_SECRET_KEY` - Payment processing
- `AWS_ACCESS_KEY_ID` - AWS services
- `EMAIL_PROVIDER` - Email service provider
- `STORAGE_PROVIDER` - File storage provider

## 🔄 Future Enhancements

- [ ] Configuration schema validation
- [ ] Environment-specific overrides
- [ ] Runtime configuration updates
- [ ] Configuration management UI
- [ ] Encrypted configuration values
- [ ] Configuration versioning
- [ ] Multi-environment deployment
- [ ] Configuration templates
