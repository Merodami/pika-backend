# Auth Package

Authentication utilities and JWT management for the Pika platform, providing centralized authentication logic shared across all services.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/auth:build

# Run tests
yarn nx run @pika
```

## 📋 Overview

The Auth package provides comprehensive authentication utilities for the Pika platform:

- **JWT Management**: Token creation, validation, and refresh logic
- **Authentication Strategies**: Pluggable authentication methods
- **User Adapters**: Service integration adapters
- **Identity Providers**: External identity provider support
- **Password Security**: Secure password hashing and validation
- **Token Services**: Access and refresh token management

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── adapters/              # External service adapters
│   └── UserServiceAdapter.ts # User service integration
├── api/                   # API layer
│   ├── controllers/       # HTTP controllers
│   │   └── AuthController.ts # Authentication endpoints
│   └── routes/            # Route definitions
│       └── authRoutes.ts  # Auth route configuration
├── application/           # Application layer
│   └── use_cases/         # Business use cases
│       ├── LoginUseCase.ts # Login workflow
│       ├── LogoutUseCase.ts # Logout workflow
│       ├── RefreshTokenUseCase.ts # Token refresh
│       └── RegisterUseCase.ts # User registration
├── config/                # Configuration
│   ├── AuthServiceConfig.ts # Service configuration
│   └── identityProviderConfig.ts # Identity provider setup
├── domain/                # Domain layer
│   ├── interfaces/        # Domain interfaces
│   │   └── IdentityProvider.ts # Provider contracts
│   └── services/          # Domain services
│       └── JwtTokenService.ts # Token management
├── infrastructure/        # Infrastructure layer
│   ├── IdentityProviderRegistry.ts # Provider registry
│   └── providers/         # Identity provider implementations
│       └── CognitoIdentityProvider.ts # AWS Cognito
├── mappers/               # Data transformation
│   └── userMapper.ts      # User data mapping
├── services/              # Service implementations
│   ├── JwtTokenService.ts # JWT operations
│   └── PasswordSecurityService.ts # Password handling
├── strategies/            # Authentication strategies
│   ├── AuthStrategy.ts    # Base strategy
│   ├── AuthStrategyFactory.ts # Strategy factory
│   └── LocalAuthStrategy.ts # Local authentication
├── test/                  # Test utilities
└── utils/                 # Utilities
    ├── getCognitoAppClientIds.ts # Cognito helpers
    ├── jwtVerifier.ts     # JWT verification
    └── userManagement.ts  # User operations
```

### Key Components

- **Use Cases**: Business logic for authentication workflows
- **JWT Service**: Token creation, validation, and management
- **Identity Providers**: External authentication integration
- **Auth Strategies**: Pluggable authentication methods
- **Password Service**: Secure password operations

## 🔌 Usage

### JWT Token Operations

```typescript
import { JwtTokenService } from '@pika

const jwtService = new JwtTokenService({
  secret: process.env.JWT_SECRET,
  expiresIn: '15m',
  refreshExpiresIn: '7d',
})

// Create access token
const accessToken = await jwtService.generateAccessToken({
  userId: 'user123',
  email: 'user@example.com',
  role: 'USER',
})

// Validate token
const payload = await jwtService.validateToken(accessToken)

// Create refresh token
const refreshToken = await jwtService.generateRefreshToken(userId)

// Refresh access token
const newTokens = await jwtService.refreshTokens(refreshToken)
```

### Authentication Use Cases

```typescript
import { LoginUseCase, RegisterUseCase } from '@pika

// User login
const loginUseCase = new LoginUseCase(authStrategy, jwtService, userService)

const loginResult = await loginUseCase.execute({
  email: 'user@example.com',
  password: 'securePassword123',
})

// User registration
const registerUseCase = new RegisterUseCase(userService, passwordService, jwtService)

const registrationResult = await registerUseCase.execute({
  email: 'newuser@example.com',
  password: 'securePassword123',
  firstName: 'John',
  lastName: 'Doe',
})
```

### Identity Provider Integration

```typescript
import { CognitoIdentityProvider } from '@pika

const cognitoProvider = new CognitoIdentityProvider({
  region: 'us-east-1',
  userPoolId: 'us-east-1_XXXXXXXXX',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
})

// Authenticate with Cognito
const cognitoResult = await cognitoProvider.authenticate({
  email: 'user@example.com',
  password: 'password',
})

// Register provider
const providerRegistry = new IdentityProviderRegistry()
providerRegistry.register('cognito', cognitoProvider)
```

## 🔧 Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ALGORITHM=HS256

# Password Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true

# AWS Cognito (if using)
AWS_COGNITO_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=your-client-id
AWS_COGNITO_CLIENT_SECRET=your-client-secret

# Auth Service
AUTH_SERVICE_URL=http://localhost:5502
AUTH_SERVICE_API_KEY=internal-auth-api-key
```

### Service Configuration

```typescript
import { AuthServiceConfig } from '@pika

const authConfig: AuthServiceConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
    refreshExpiresIn: '7d',
    algorithm: 'HS256',
  },

  password: {
    rounds: 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },

  identityProviders: {
    cognito: {
      region: process.env.AWS_COGNITO_REGION,
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      clientId: process.env.AWS_COGNITO_CLIENT_ID,
      clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
    },
  },
}
```

## 🧪 Testing

```bash
# Run all tests
yarn nx run @pika

# Run unit tests
yarn nx run @pika --grep "unit"

# Run integration tests
yarn nx run @pika --grep "integration"

# Test JWT operations
yarn nx run @pika --grep "jwt"
```

### Test Examples

```typescript
import { JwtTokenService, PasswordSecurityService } from '@pika

describe('JwtTokenService', () => {
  let jwtService: JwtTokenService

  beforeEach(() => {
    jwtService = new JwtTokenService({
      secret: 'test-secret',
      expiresIn: '1h',
    })
  })

  it('should generate valid access token', async () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = await jwtService.generateAccessToken(payload)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
  })

  it('should validate token correctly', async () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = await jwtService.generateAccessToken(payload)
    const decoded = await jwtService.validateToken(token)

    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
  })
})
```

## 🔄 Integration with Services

### Express Middleware Integration

```typescript
import { authMiddleware } from '@pika
import express from 'express'

const app = express()

// Apply auth middleware
app.use(
  '/protected',
  authMiddleware({
    jwtSecret: process.env.JWT_SECRET,
    excludePaths: ['/health', '/docs'],
  }),
)

// Protected route
app.get('/protected/profile', (req, res) => {
  // req.user is automatically populated
  res.json({ user: req.user })
})
```

### Service Client Authentication

```typescript
import { createServiceClient } from '@pika

const userServiceClient = createServiceClient({
  baseURL: process.env.USER_SERVICE_URL,
  apiKey: process.env.USER_SERVICE_API_KEY,
  timeout: 5000,
})

// Automatically adds authentication headers
const user = await userServiceClient.get(`/users/${userId}`)
```

## 🔒 Security Features

### Password Security

- **Bcrypt Hashing**: Industry-standard password hashing
- **Salt Rounds**: Configurable complexity (default: 12)
- **Password Policies**: Configurable strength requirements
- **Timing Attack Protection**: Constant-time comparisons

### JWT Security

- **Short Expiry**: 15-minute access tokens
- **Refresh Tokens**: 7-day refresh cycle
- **Token Rotation**: New refresh token on each refresh
- **Blacklisting**: Token invalidation support

### Identity Provider Security

- **OAuth 2.0**: Industry-standard authentication
- **PKCE**: Proof Key for Code Exchange
- **State Validation**: CSRF protection
- **Scope Limitation**: Minimal permission requests

## 📊 Authentication Strategies

### Local Strategy

```typescript
const localStrategy = new LocalAuthStrategy({
  userService,
  passwordService,
})

// Authenticate with email/password
const result = await localStrategy.authenticate({
  email: 'user@example.com',
  password: 'password123',
})
```

### OAuth Strategy (Future)

```typescript
const oauthStrategy = new OAuthStrategy({
  provider: 'google',
  clientId: 'google-client-id',
  clientSecret: 'google-client-secret',
  scopes: ['email', 'profile'],
})
```

## 🚨 Error Handling

### Authentication Errors

```typescript
// Common error types
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PASSWORD_WEAK = 'PASSWORD_WEAK',
  PROVIDER_ERROR = 'PROVIDER_ERROR'
}

// Error response format
{
  "error": "Authentication failed",
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔄 Future Enhancements

- [ ] Multi-factor authentication (MFA)
- [ ] Biometric authentication support
- [ ] Social OAuth providers (Google, Facebook, Apple)
- [ ] Passwordless authentication
- [ ] Account lockout policies
- [ ] Session management
- [ ] Device trust and tracking
- [ ] Advanced threat detection
