# Firebase Authentication Complete Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Firebase Console Setup](#firebase-console-setup)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Configuration](#security-configuration)
7. [Testing Strategy](#testing-strategy)
8. [Deployment & Monitoring](#deployment--monitoring)
9. [Migration Strategy](#migration-strategy)

## Overview

This guide provides a comprehensive implementation of Firebase Authentication for the Pika marketplace platform. The implementation follows a **hybrid authentication system** that combines Firebase for external provider authentication with internal JWT tokens for API access.

### Key Features

- **Provider-Agnostic Design**: Works with any identity provider (current or future)
- **Dual Authentication**: JWT (primary) + Firebase Custom Tokens (real-time features)
- **Clean Architecture**: Maintains separation of concerns and testability
- **Multi-Provider Support**: Google, Facebook, Apple, and custom providers
- **Real-time Features**: Secure messaging and notifications via Firestore
- **Device Management**: Track and manage user devices and sessions

## Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Flutter   │    │  Firebase   │    │   Backend   │
│     App     │    │    Auth     │    │     API     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. signInWithGoogle()                │
       ├──────────────────→│                   │
       │                   │                   │
       │ 2. Firebase ID Token                  │
       │←──────────────────┤                   │
       │                   │                   │
       │ 3. POST /auth/exchange-token          │
       │ {                                     │
       │   firebase_id_token: "eyJ...",        │
       │   provider: "google",                 │
       │   device_info: {...}                  │
       │ }                                     │
       ├──────────────────────────────────────→│
       │                   │                   │
       │ 4. Verify Firebase Token             │
       │                   │←──────────────────┤
       │                   │                   │
       │ 5. User Profile & Claims              │
       │                   │───────────────────→│
       │                   │                   │
       │ 6. JWT Tokens + User Data             │
       │←──────────────────────────────────────┤
       │                   │                   │
       │ 7. Store securely & update state      │
       │                   │                   │
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │    UI       │  │  Providers  │  │   Controllers   │    │
│  │ Components  │  │ (Riverpod)  │  │   (Fastify)     │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ Use Cases   │  │ Use Cases   │  │  Command/Query  │    │
│  │ (Flutter)   │  │ (Node.js)   │  │    Handlers     │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │  Entities   │  │ Repository  │  │   Domain        │    │
│  │             │  │ Interfaces  │  │   Services      │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ Data        │  │ External    │  │    Database     │    │
│  │ Sources     │  │ Services    │  │   Repositories  │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Firebase Console Setup

### 1. Project Creation

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing (e.g., `pika-demo`)
3. Enable Google Analytics (optional)

### 2. Authentication Setup

1. Navigate to **Build > Authentication**
2. Click **Sign-in method** tab
3. Enable providers:
   - **Custom Authentication** (for JWT exchange)
   - **Google** (if using Google Sign-In)
   - **Facebook** (if using Facebook Login)
   - **Apple** (if using Apple Sign-In)
4. Under **Settings > Authorized domains**, add:
   - `localhost` (development)
   - Your production domain(s)

### 3. Firestore Database

1. Navigate to **Build > Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select location (cannot be changed later)
5. Deploy security rules (see Security Configuration section)

### 4. Firebase Cloud Messaging (FCM)

1. Navigate to **Project settings** > **Cloud Messaging**
2. For iOS:
   - Upload APNs Authentication Key (.p8 file)
   - Provide Key ID and Team ID
3. For Web:
   - Click **Generate key pair** under Web Push certificates
   - Save VAPID public key for `REACT_APP_FIREBASE_VAPID_KEY`

### 5. App Registration

1. In **Project settings > General**:

**Web App:**

```javascript
// Save these values for firebase.config.ts
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-auth-domain',
  projectId: 'your-project-id',
  storageBucket: 'your-storage-bucket',
  messagingSenderId: 'your-sender-id',
  appId: 'your-app-id',
  measurementId: 'your-measurement-id',
}
```

**iOS App:**

- Register with Bundle ID
- Download `GoogleService-Info.plist`
- Add to Xcode project

**Android App:**

- Register with Package Name
- Download `google-services.json`
- Add to app directory

### 6. Service Account (Backend)

1. Navigate to **Project settings > Service accounts**
2. Click **Generate new private key**
3. Save JSON file securely
4. Extract:
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Backend Implementation

### 1. Environment Configuration

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=pika-demo
FIREBASE_CLIENT_EMAIL=your-service-account@pika-demo.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099  # Development only

# JWT Configuration
JWT_ACCESS_SECRET=your-access-token-secret  # Min 32 chars
JWT_REFRESH_SECRET=your-refresh-token-secret  # Min 32 chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=pika-auth
```

### 2. Firebase Admin Client

```typescript
// packages/shared/src/firebase/FirebaseAdminClient.ts
import { initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export class FirebaseAdminClient {
  private static instance: FirebaseAdminClient
  private app: App

  private constructor() {
    const useEmulator = process.env.FIREBASE_EMULATOR === 'true'

    if (useEmulator) {
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
    }

    this.app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
  }

  static getInstance(): FirebaseAdminClient {
    if (!FirebaseAdminClient.instance) {
      FirebaseAdminClient.instance = new FirebaseAdminClient()
    }
    return FirebaseAdminClient.instance
  }

  get auth() {
    return getAuth(this.app)
  }

  get firestore() {
    return getFirestore(this.app)
  }
}
```

### 3. Token Exchange Implementation

```typescript
// packages/services/user/src/write/api/controllers/AuthController.ts
export class AuthController {
  async exchangeToken(request: FastifyRequest, reply: FastifyReply) {
    const { firebase_id_token, provider, device_info } = request.body

    try {
      // 1. Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(firebase_id_token)
      const { uid, email, name, picture } = decodedToken

      // 2. Extract user information
      const userInfo = {
        firebaseUid: uid,
        email: email,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        avatarUrl: picture,
        provider: provider,
        isEmailVerified: decodedToken.email_verified,
      }

      // 3. Create or update user
      const user = await this.userService.findOrCreateFromFirebase(userInfo)

      // 4. Generate JWT tokens
      const tokens = await this.tokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      // 5. Save device session
      await this.sessionService.createSession({
        userId: user.id,
        deviceInfo: device_info,
        refreshToken: tokens.refreshToken,
      })

      // 6. Return response
      return reply.status(200).send({
        success: true,
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: 3600,
          token_type: 'Bearer',
          user: {
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
            is_new_user: user.createdAt === user.updatedAt,
            requires_additional_info: !user.phoneNumber,
            requires_mfa: user.mfaEnabled,
          },
        },
      })
    } catch (error) {
      if (error.code === 'auth/id-token-expired') {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'token_expired',
            message: 'Firebase token expired',
          },
        })
      }

      return reply.status(400).send({
        success: false,
        error: {
          code: 'authentication_failed',
          message: 'Token exchange failed',
        },
      })
    }
  }
}
```

### 4. Firebase Custom Token Generation

```typescript
// packages/services/user/src/write/application/use_cases/commands/GenerateFirebaseTokenCommandHandler.ts
export class GenerateFirebaseTokenCommandHandler {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminClient,
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(command: GenerateFirebaseTokenCommand): Promise<FirebaseTokenResponse> {
    // 1. Validate user exists and is active
    const user = await this.userRepository.findById(command.userId)
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive')
    }

    // 2. Build custom claims
    const customClaims: FirebaseCustomClaims = {
      userId: user.id,
      role: user.role,
      purpose: command.purpose || 'real-time',
      permissions: user.permissions || [],
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + (command.expiresIn || 3600),
    }

    // 3. Generate Firebase custom token
    const customToken = await this.firebaseAdmin.auth().createCustomToken(user.id, customClaims)

    // 4. Log token issuance
    this.logger.info('Firebase token issued', {
      userId: user.id,
      purpose: command.purpose,
      expiresAt: new Date(customClaims.expiresAt * 1000),
    })

    // 5. Return response
    return {
      customToken,
      expiresAt: new Date(customClaims.expiresAt * 1000).toISOString(),
      claims: customClaims,
    }
  }
}
```

## Frontend Implementation

### 1. Flutter Clean Architecture

```dart
// Domain Layer - Use Case
class GoogleSignInUseCase {
  final AuthRepository _repository;

  GoogleSignInUseCase(this._repository);

  Future<Either<AppException, (UserEntity, AuthTokensEntity)>> call({
    required String firebaseIdToken,
    required Map<String, dynamic> deviceInfo,
  }) async {
    // Validation
    if (firebaseIdToken.isEmpty) {
      return Left(ValidationException('Firebase ID token cannot be empty'));
    }

    // Execute business logic
    final result = await _repository.exchangeFirebaseToken(
      firebaseIdToken: firebaseIdToken,
      provider: 'google',
      deviceInfo: deviceInfo,
    );

    // Handle result
    return result.fold(
      (error) => Left(error),
      (data) async {
        final (user, tokens) = data;
        await _repository.saveTokens(tokens);
        return Right((user, tokens));
      },
    );
  }
}
```

### 2. Secure Token Storage

```dart
// ✅ Secure (FlutterSecureStorage)
class SecureTokenStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: IOSAccessibility.first_unlock_this_device,
    ),
  );

  static Future<void> saveToken(String key, String token) async {
    await _storage.write(key: key, value: token);
  }

  static Future<String?> getToken(String key) async {
    return await _storage.read(key: key);
  }

  static Future<void> deleteToken(String key) async {
    await _storage.delete(key: key);
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
```

### 3. Device Information Service

```dart
class DeviceInfoService {
  static Future<Map<String, dynamic>> getDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return {
        'device_id': androidInfo.id,
        'device_name': '${androidInfo.brand} ${androidInfo.model}',
        'device_type': 'android',
        'os_version': androidInfo.version.release,
        'sdk_version': androidInfo.version.sdkInt,
        'manufacturer': androidInfo.manufacturer,
        'is_physical': androidInfo.isPhysicalDevice,
      };
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return {
        'device_id': iosInfo.identifierForVendor ?? 'unknown',
        'device_name': '${iosInfo.name} ${iosInfo.model}',
        'device_type': 'ios',
        'os_version': iosInfo.systemVersion,
        'model': iosInfo.model,
        'is_physical': iosInfo.isPhysicalDevice,
      };
    }

    return {
      'device_id': 'web-device',
      'device_name': 'Web Browser',
      'device_type': 'web',
    };
  }
}
```

## Security Configuration

### 1. Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function hasUserAccess(userId) {
      return isAuthenticated() &&
             request.auth.uid == userId &&
             request.auth.token.purpose in ['messaging', 'real-time', 'notifications'];
    }

    function isParticipant(conversationData) {
      return isAuthenticated() &&
             request.auth.uid in conversationData.participants;
    }

    // User notifications
    match /users/{userId}/notifications/{notificationId} {
      allow read: if hasUserAccess(userId);
      allow update: if hasUserAccess(userId) &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
    }

    // User documents
    match /users/{userId} {
      allow read, update: if hasUserAccess(userId);
    }

    // Conversations
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() &&
                     request.auth.uid in resource.data.participants;
      allow write: if isAuthenticated() &&
                      request.auth.uid in resource.data.participants &&
                      request.auth.token.purpose in ['messaging', 'real-time'];

      // Messages within conversations
      match /messages/{messageId} {
        allow read, write: if isAuthenticated() &&
                              request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants &&
                              request.auth.token.purpose in ['messaging', 'real-time'];
      }
    }
  }
}
```

### 2. Firebase Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User uploads
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024 && // Max 5MB
                      request.resource.contentType.matches('image/.*');
    }

    // Profile images
    match /profileImages/{userId}/{fileName} {
      allow read: true; // Public profile images
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. API Key Restrictions

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Find your Firebase API keys
3. Apply restrictions:
   - **Application restrictions**: HTTP referrers for web, app IDs for mobile
   - **API restrictions**: Limit to necessary Firebase APIs only

### 4. Security Best Practices

1. **Token Security**
   - Short-lived access tokens (15m-1h)
   - Longer refresh tokens (7-30d)
   - Secure storage on client side
   - Regular token rotation

2. **Input Validation**
   - Validate all inputs on backend
   - Use TypeScript schemas
   - Sanitize user-generated content
   - Limit request sizes

3. **Rate Limiting**
   - Token exchange endpoint: 5 requests per minute
   - Message sending: 30 per minute
   - API calls: Based on user tier

4. **Monitoring**
   - Track authentication failures
   - Monitor token usage patterns
   - Alert on suspicious activities
   - Regular security audits

## Testing Strategy

### 1. Backend Unit Tests

```typescript
describe('Firebase Token Exchange', () => {
  test('should exchange valid Firebase token for JWT', async () => {
    // Arrange
    const mockFirebaseToken = 'valid.firebase.token'
    const mockUserData = {
      uid: 'firebase-uid-123',
      email: 'user@example.com',
      name: 'John Doe',
    }

    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue(mockUserData)

    // Act
    const response = await request(app)
      .post('/auth/exchange-token')
      .send({
        firebase_id_token: mockFirebaseToken,
        provider: 'google',
        device_info: { device_id: 'test-device' },
      })

    // Assert
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('success', true)
    expect(response.body.data).toHaveProperty('access_token')
    expect(response.body.data).toHaveProperty('refresh_token')
  })
})
```

### 2. Integration Tests

```typescript
describe('Firebase Auth Integration', () => {
  it('should authenticate via API and access Firestore', async () => {
    // 1. Get Firebase custom token
    const tokenResponse = await request(app).post('/api/v1/auth/firebase-token').set('Authorization', `Bearer ${validJWT}`).send({ purpose: 'messaging' })

    expect(tokenResponse.status).toBe(200)

    // 2. Use token to access Firestore
    const auth = getAuth()
    await signInWithCustomToken(auth, tokenResponse.body.customToken)

    // 3. Verify Firestore access
    const db = getFirestore()
    const userDoc = await getDoc(doc(db, 'users', userId))
    expect(userDoc.exists()).toBe(true)
  })
})
```

### 3. Security Tests

- Token validation bypass attempts
- Invalid JWT token scenarios
- Expired token handling
- Cross-user access attempts
- Custom claims manipulation
- Rate limiting verification

## Deployment & Monitoring

### 1. Environment Setup

```bash
# Development
yarn docker:local  # Start emulators
yarn local:generate  # Setup database
yarn local  # Start services

# Production
export NODE_ENV=production
export FIREBASE_EMULATOR=false
# Set all production secrets
```

### 2. Monitoring Metrics

```typescript
// Key metrics to track
interface AuthMetrics {
  tokenIssuanceRate: number // Tokens/minute
  tokenIssuanceFailureRate: number // Failed requests/minute
  firebaseAuthFailureRate: number // Auth failures/minute
  tokenExpirationRate: number // Expirations/minute
  securityRuleViolations: number // Violations/minute
}

// Structured logging
logger.info('Firebase token issued', {
  userId: user.id,
  purpose: command.purpose,
  expiresAt: tokenExpiresAt,
  claims: customClaims,
  requestId: request.id,
})
```

### 3. Alerting Configuration

- High failure rates (>5% token failures)
- Security violations (repeated from same user)
- Unusual patterns (mass requests, off-hours)
- Performance issues (slow generation, timeouts)

## Migration Strategy

### Phase 1: Development (Immediate)

1. **Feature Flag**: `ENABLE_FIREBASE_CUSTOM_TOKEN`
2. **Backward Compatibility**: Existing auth as fallback
3. **Gradual Rollout**: Test clients first

### Phase 2: Production (Staged)

1. **Week 1**: Deploy endpoint, monitor metrics
2. **Week 2**: Update mobile apps gradually
3. **Week 3**: Migrate existing users
4. **Week 4**: Remove fallback methods

### Rollback Plan

1. **Immediate**: Disable feature flag
2. **Database**: No schema changes needed
3. **Firebase Rules**: Maintain compatibility
4. **Monitoring**: Alert on failure increases

## Performance Optimization

### 1. Token Caching

```typescript
// Cache valid tokens until near expiration
class TokenCache {
  private cache = new Map<string, CachedToken>()

  async getOrGenerate(userId: string): Promise<string> {
    const cached = this.cache.get(userId)

    if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
      return cached.token
    }

    const newToken = await this.generateToken(userId)
    this.cache.set(userId, newToken)
    return newToken.token
  }
}
```

### 2. Connection Pooling

```typescript
// Efficient Firebase Admin SDK management
class FirebasePool {
  private connections: FirebaseAdminClient[] = []

  getConnection(): FirebaseAdminClient {
    // Round-robin or least-loaded selection
    return this.connections[this.currentIndex++ % this.connections.length]
  }
}
```

### Expected Performance

- Token Generation: <100ms average
- Firebase Authentication: <200ms average
- Firestore Operations: <300ms average
- Concurrent Users: 1000+ real-time connections

## Conclusion

This implementation provides:

✅ **Security**: Multi-layered security with proper token management  
✅ **Scalability**: Supports multiple providers and high concurrency  
✅ **Maintainability**: Clean architecture with clear separation  
✅ **Flexibility**: Easy to add new providers or features  
✅ **Performance**: Optimized for production workloads  
✅ **Monitoring**: Comprehensive logging and metrics

The hybrid approach combines the best of Firebase's real-time capabilities with your existing JWT-based API authentication, providing a robust foundation for the Pika marketplace platform.
