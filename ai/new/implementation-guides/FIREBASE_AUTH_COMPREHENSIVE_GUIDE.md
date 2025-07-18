# Firebase Authentication Comprehensive Guide

## Overview

This guide provides a complete implementation reference for Firebase Authentication in the Pika platform, following a provider-agnostic design that maintains flexibility while ensuring security and performance.

### Architecture Overview

The authentication system uses a hybrid approach:

- **Firebase**: Handles authentication, user management, and social login providers
- **JWT Tokens**: Used for API authentication after Firebase verification
- **Custom Tokens**: Enable seamless integration between Firebase and backend services

### Key Benefits

- Provider independence (can swap Firebase later)
- Centralized authentication management
- Support for multiple auth providers (Email, Google, Facebook, Apple)
- Secure token exchange mechanism
- Real-time security rules

## Firebase Console Setup

### 1. Project Creation and Configuration

1. **Create Firebase Project**

   ```
   Project Name: pika-[environment]
   Enable Google Analytics: Optional
   ```

2. **Enable Authentication**
   - Email/Password
   - Google Sign-In
   - Facebook Login (requires Facebook App ID)
   - Apple Sign-In (requires Apple Developer account)

3. **Configure OAuth Redirect URIs**
   ```
   Development: http://localhost:3000/auth/callback
   Production: https://api.pika.com/auth/callback
   ```

### 2. Service Configuration

#### Firestore Database

1. Create database in production mode
2. Select nearest region (us-east1 recommended)
3. Configure security rules (see Security Configuration section)

#### Cloud Storage

1. Create default bucket
2. Configure CORS for web uploads
3. Set security rules for user uploads

#### Cloud Functions

1. Initialize Functions (Node.js 18+)
2. Deploy auth triggers and custom token generation

### 3. SDK Configuration

Generate and download service account key:

```bash
Firebase Console → Project Settings → Service Accounts → Generate New Private Key
```

## Backend Implementation

### 1. Firebase Admin SDK Setup

```typescript
// packages/auth/src/infrastructure/firebase/FirebaseAdmin.ts
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export class FirebaseAdmin {
  private static instance: FirebaseAdmin
  private auth: Auth

  private constructor() {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }

    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    })

    this.auth = getAuth()
  }

  static getInstance(): FirebaseAdmin {
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin()
    }
    return FirebaseAdmin.instance
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(idToken, true)
    } catch (error) {
      throw new UnauthorizedError('Invalid Firebase token')
    }
  }

  async createCustomToken(uid: string, claims?: object): Promise<string> {
    return await this.auth.createCustomToken(uid, claims)
  }

  async getUserByEmail(email: string): Promise<UserRecord> {
    return await this.auth.getUserByEmail(email)
  }

  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    await this.auth.setCustomUserClaims(uid, claims)
  }
}
```

### 2. Token Exchange Service

```typescript
// packages/auth/src/application/services/TokenExchangeService.ts
export class TokenExchangeService {
  constructor(
    private firebaseAdmin: FirebaseAdmin,
    private jwtService: JwtService,
    private userRepository: UserRepositoryPort,
    private cacheService: CacheService,
  ) {}

  async exchangeFirebaseTokenForJWT(firebaseToken: string): Promise<TokenPair> {
    // Check cache first
    const cacheKey = `token:${createHash('sha256').update(firebaseToken).digest('hex')}`
    const cached = await this.cacheService.get<TokenPair>(cacheKey)
    if (cached) return cached

    // Verify Firebase token
    const decodedToken = await this.firebaseAdmin.verifyIdToken(firebaseToken)

    // Get or create user
    let user = await this.userRepository.findByFirebaseUid(decodedToken.uid)
    if (!user) {
      user = await this.createUserFromFirebase(decodedToken)
    }

    // Generate JWT tokens
    const tokens = await this.jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    })

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, tokens, 300)

    return tokens
  }

  private async createUserFromFirebase(decodedToken: DecodedIdToken): Promise<User> {
    const userDto: CreateUserDto = {
      email: decodedToken.email!,
      firebaseUid: decodedToken.uid,
      name: decodedToken.name || '',
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified || false,
      provider: decodedToken.firebase.sign_in_provider,
    }

    return await this.userRepository.create(userDto)
  }
}
```

### 3. Authentication Middleware

```typescript
// packages/http/src/infrastructure/fastify/middleware/auth.ts
export const firebaseAuthMiddleware = (firebaseAdmin: FirebaseAdmin) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = extractBearerToken(request)
      if (!token) {
        throw new UnauthorizedError('No token provided')
      }

      const decodedToken = await firebaseAdmin.verifyIdToken(token)
      request.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        roles: decodedToken.roles || [],
      }
    } catch (error) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  }
}
```

### 4. Authentication Routes

```typescript
// packages/api/src/routes/auth/auth.ts
export class AuthRouter {
  constructor(
    private tokenExchangeService: TokenExchangeService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async routes(fastify: FastifyInstance) {
    // Token exchange endpoint
    fastify.post('/auth/token/exchange', {
      schema: {
        body: Type.Object({
          firebaseToken: Type.String(),
        }),
        response: {
          200: Type.Object({
            accessToken: Type.String(),
            refreshToken: Type.String(),
            expiresIn: Type.Number(),
          }),
        },
      },
      handler: async (request, reply) => {
        const { firebaseToken } = request.body
        const tokens = await this.tokenExchangeService.exchangeFirebaseTokenForJWT(firebaseToken)
        return reply.send(tokens)
      },
    })

    // Refresh token endpoint
    fastify.post('/auth/token/refresh', {
      schema: {
        body: Type.Object({
          refreshToken: Type.String(),
        }),
      },
      handler: async (request, reply) => {
        const { refreshToken } = request.body
        const tokens = await this.refreshTokenService.refresh(refreshToken)
        return reply.send(tokens)
      },
    })

    // Logout endpoint
    fastify.post('/auth/logout', {
      preHandler: [authenticate],
      handler: async (request, reply) => {
        await this.refreshTokenService.revoke(request.user.id)
        return reply.send({ success: true })
      },
    })
  }
}
```

## Frontend Implementation (Flutter)

### 1. Firebase Configuration

```dart
// lib/infrastructure/firebase/firebase_config.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FirebaseConfig {
  static Future<void> initialize() async {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: String.fromEnvironment('FIREBASE_API_KEY'),
        authDomain: String.fromEnvironment('FIREBASE_AUTH_DOMAIN'),
        projectId: String.fromEnvironment('FIREBASE_PROJECT_ID'),
        storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID'),
        appId: String.fromEnvironment('FIREBASE_APP_ID'),
      ),
    );
  }
}
```

### 2. Authentication Repository

```dart
// lib/domain/auth/auth_repository.dart
abstract class AuthRepository {
  Future<AuthTokens> signInWithEmail(String email, String password);
  Future<AuthTokens> signInWithGoogle();
  Future<AuthTokens> signInWithApple();
  Future<AuthTokens> refreshToken(String refreshToken);
  Future<void> signOut();
  Stream<AuthState> get authStateChanges;
}

// lib/infrastructure/auth/firebase_auth_repository.dart
class FirebaseAuthRepository implements AuthRepository {
  final FirebaseAuth _firebaseAuth;
  final TokenExchangeService _tokenExchange;
  final SecureStorage _secureStorage;

  @override
  Future<AuthTokens> signInWithEmail(String email, String password) async {
    try {
      // Sign in with Firebase
      final credential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Get Firebase ID token
      final firebaseToken = await credential.user!.getIdToken();

      // Exchange for JWT
      final tokens = await _tokenExchange.exchangeToken(firebaseToken);

      // Store tokens securely
      await _secureStorage.saveTokens(tokens);

      return tokens;
    } on FirebaseAuthException catch (e) {
      throw _mapFirebaseException(e);
    }
  }

  @override
  Future<AuthTokens> signInWithGoogle() async {
    // Configure Google Sign In
    final GoogleSignIn googleSignIn = GoogleSignIn(
      scopes: ['email', 'profile'],
    );

    // Trigger sign in flow
    final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
    if (googleUser == null) throw AuthCancelledException();

    // Get auth details
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

    // Create Firebase credential
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    // Sign in to Firebase
    final userCredential = await _firebaseAuth.signInWithCredential(credential);

    // Exchange tokens
    final firebaseToken = await userCredential.user!.getIdToken();
    return await _tokenExchange.exchangeToken(firebaseToken);
  }
}
```

### 3. Authentication State Management

```dart
// lib/application/auth/auth_cubit.dart
class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _authRepository;
  StreamSubscription? _authSubscription;

  AuthCubit(this._authRepository) : super(AuthInitial()) {
    _authSubscription = _authRepository.authStateChanges.listen((state) {
      emit(state);
    });
  }

  Future<void> signInWithEmail(String email, String password) async {
    emit(AuthLoading());
    try {
      final tokens = await _authRepository.signInWithEmail(email, password);
      emit(AuthAuthenticated(tokens: tokens));
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }

  Future<void> signOut() async {
    await _authRepository.signOut();
    emit(AuthUnauthenticated());
  }

  @override
  Future<void> close() {
    _authSubscription?.cancel();
    return super.close();
  }
}
```

### 4. HTTP Client with Authentication

```dart
// lib/infrastructure/http/authenticated_http_client.dart
class AuthenticatedHttpClient {
  final Dio _dio;
  final SecureStorage _secureStorage;
  final TokenExchangeService _tokenExchange;

  AuthenticatedHttpClient() {
    _dio = Dio(BaseOptions(
      baseUrl: const String.fromEnvironment('API_BASE_URL'),
      connectTimeout: const Duration(seconds: 30),
    ));

    // Add auth interceptor
    _dio.interceptors.add(AuthInterceptor(
      secureStorage: _secureStorage,
      tokenExchange: _tokenExchange,
    ));
  }
}

class AuthInterceptor extends Interceptor {
  final SecureStorage secureStorage;
  final TokenExchangeService tokenExchange;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Get access token
    final token = await secureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioError err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Try to refresh token
      final refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken != null) {
        try {
          final newTokens = await tokenExchange.refreshToken(refreshToken);
          await secureStorage.saveTokens(newTokens);

          // Retry original request
          final opts = err.requestOptions;
          opts.headers['Authorization'] = 'Bearer ${newTokens.accessToken}';
          final response = await _dio.fetch(opts);
          handler.resolve(response);
          return;
        } catch (e) {
          // Refresh failed, clear tokens
          await secureStorage.clearTokens();
        }
      }
    }
    handler.next(err);
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

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function hasRole(role) {
      return isAuthenticated() && role in request.auth.token.roles;
    }

    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || hasRole('admin');
    }

    // Retailers
    match /retailers/{retailerId} {
      allow read: if true; // Public read
      allow create: if isAuthenticated() && request.auth.uid == resource.data.userId;
      allow update: if isOwner(resource.data.userId) || hasRole('admin');
      allow delete: if hasRole('admin');
    }

    // Vouchers
    match /vouchers/{voucherId} {
      allow read: if isOwner(resource.data.customerId) ||
                     isOwner(resource.data.retailerId) ||
                     hasRole('admin');
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.customerId) ||
                      isOwner(resource.data.retailerId);
      allow delete: if hasRole('admin');
    }

    // Chat messages
    match /conversations/{conversationId}/messages/{messageId} {
      allow read: if isAuthenticated() &&
                    (request.auth.uid in resource.data.participants);
      allow create: if isAuthenticated() &&
                      (request.auth.uid in request.resource.data.participants);
      allow update: if false; // Messages are immutable
      allow delete: if false;
    }
  }
}
```

### 2. Cloud Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isImageFile() {
      return request.resource.contentType.matches('image/.*');
    }

    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024; // 10MB
    }

    // User profile pictures
    match /users/{userId}/profile/{fileName} {
      allow read: if true; // Public read
      allow write: if isOwner(userId) && isImageFile() && isValidSize();
    }

    // Voucher images
    match /vouchers/{voucherId}/images/{fileName} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() && isImageFile() && isValidSize();
    }
  }
}
```

### 3. API Security Best Practices

```typescript
// Security middleware configuration
export const securityConfig = {
  // Rate limiting
  rateLimit: {
    global: {
      max: 100,
      timeWindow: '1 minute',
    },
    auth: {
      max: 5,
      timeWindow: '15 minutes',
    },
  },

  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  // Helmet configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  },

  // API key restrictions (Firebase Console)
  apiKeyRestrictions: {
    websites: ['https://*.pika.com'],
    androidApps: ['com.pika.app'],
    iosApps: ['com.pika.app'],
  },
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
// Token Exchange Service Tests
describe('TokenExchangeService', () => {
  let service: TokenExchangeService
  let mockFirebaseAdmin: jest.Mocked<FirebaseAdmin>
  let mockJwtService: jest.Mocked<JwtService>

  beforeEach(() => {
    mockFirebaseAdmin = createMock<FirebaseAdmin>()
    mockJwtService = createMock<JwtService>()
    service = new TokenExchangeService(mockFirebaseAdmin, mockJwtService, mockUserRepository, mockCacheService)
  })

  it('should exchange valid Firebase token for JWT', async () => {
    // Arrange
    const firebaseToken = 'valid-firebase-token'
    const decodedToken = {
      uid: 'firebase-uid',
      email: 'user@example.com',
      email_verified: true,
    }

    mockFirebaseAdmin.verifyIdToken.mockResolvedValue(decodedToken)
    mockUserRepository.findByFirebaseUid.mockResolvedValue(mockUser)
    mockJwtService.generateTokenPair.mockResolvedValue(mockTokens)

    // Act
    const result = await service.exchangeFirebaseTokenForJWT(firebaseToken)

    // Assert
    expect(result).toEqual(mockTokens)
    expect(mockFirebaseAdmin.verifyIdToken).toHaveBeenCalledWith(firebaseToken)
  })

  it('should create new user if not exists', async () => {
    // Test user creation flow
  })

  it('should use cached tokens when available', async () => {
    // Test caching behavior
  })
})
```

### 2. Integration Tests

```typescript
// Authentication flow integration tests
describe('Authentication Flow', () => {
  let app: FastifyInstance
  let firebaseAuth: FirebaseAuth

  beforeAll(async () => {
    app = await createTestApp()
    firebaseAuth = getAuth()
  })

  it('should complete full authentication flow', async () => {
    // 1. Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, 'test@example.com', 'password123')

    // 2. Get Firebase ID token
    const firebaseToken = await userCredential.user.getIdToken()

    // 3. Exchange for JWT
    const response = await app.inject({
      method: 'POST',
      url: '/auth/token/exchange',
      payload: { firebaseToken },
    })

    expect(response.statusCode).toBe(200)
    const { accessToken, refreshToken } = response.json()
    expect(accessToken).toBeDefined()
    expect(refreshToken).toBeDefined()

    // 4. Use JWT to access protected endpoint
    const protectedResponse = await app.inject({
      method: 'GET',
      url: '/api/user/profile',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    expect(protectedResponse.statusCode).toBe(200)
  })
})
```

### 3. Security Tests

```typescript
describe('Security Tests', () => {
  it('should reject expired Firebase tokens', async () => {
    const expiredToken = 'expired-firebase-token'

    const response = await app.inject({
      method: 'POST',
      url: '/auth/token/exchange',
      payload: { firebaseToken: expiredToken },
    })

    expect(response.statusCode).toBe(401)
  })

  it('should enforce rate limiting on auth endpoints', async () => {
    // Make multiple requests
    const requests = Array(10)
      .fill(null)
      .map(() =>
        app.inject({
          method: 'POST',
          url: '/auth/token/exchange',
          payload: { firebaseToken: 'token' },
        }),
      )

    const responses = await Promise.all(requests)
    const rateLimited = responses.filter((r) => r.statusCode === 429)
    expect(rateLimited.length).toBeGreaterThan(0)
  })
})
```

## Deployment & Monitoring

### 1. Environment Configuration

```bash
# .env.production
FIREBASE_PROJECT_ID=pika-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@pika-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=pika-prod.firebaseapp.com
FIREBASE_STORAGE_BUCKET=pika-prod.appspot.com
```

### 2. Deployment Steps

```bash
# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy Cloud Functions
cd functions && npm run deploy

# Deploy backend services
kubectl apply -f k8s/auth-service.yaml
```

### 3. Monitoring Setup

```typescript
// Metrics collection
export const authMetrics = {
  tokenExchangeSuccess: new Counter({
    name: 'auth_token_exchange_success_total',
    help: 'Total successful token exchanges',
  }),

  tokenExchangeFailure: new Counter({
    name: 'auth_token_exchange_failure_total',
    help: 'Total failed token exchanges',
    labelNames: ['error_type'],
  }),

  tokenExchangeDuration: new Histogram({
    name: 'auth_token_exchange_duration_seconds',
    help: 'Token exchange duration in seconds',
    buckets: [0.1, 0.5, 1, 2, 5],
  }),
}

// Usage tracking
export const trackAuthEvent = async (event: AuthEvent) => {
  await analytics.track({
    userId: event.userId,
    event: event.type,
    properties: {
      provider: event.provider,
      success: event.success,
      timestamp: new Date().toISOString(),
    },
  })
}
```

### 4. Alerts Configuration

```yaml
# alerts.yaml
groups:
  - name: authentication
    rules:
      - alert: HighAuthFailureRate
        expr: rate(auth_token_exchange_failure_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High authentication failure rate

      - alert: AuthServiceDown
        expr: up{job="auth-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Authentication service is down
```

## Migration Strategy

### Phase 1: Parallel Operation (Weeks 1-2)

- Deploy Firebase auth alongside existing system
- Add feature flag for gradual rollout
- Monitor both systems

### Phase 2: Gradual Migration (Weeks 3-4)

- Migrate 10% of users daily
- Monitor error rates and performance
- Implement rollback procedures

### Phase 3: Full Migration (Week 5)

- Complete migration of remaining users
- Deprecate old auth system
- Update documentation

### Rollback Plan

```typescript
// Feature flag configuration
export const authConfig = {
  useFirebase: process.env.USE_FIREBASE_AUTH === 'true',
  fallbackToLegacy: process.env.ENABLE_AUTH_FALLBACK === 'true',
}

// Fallback implementation
if (authConfig.fallbackToLegacy && firebaseAuthFailed) {
  return await legacyAuth.authenticate(credentials)
}
```

## Performance Optimization

### 1. Token Caching Strategy

```typescript
// Multi-level caching
export class TokenCache {
  private memoryCache = new Map<string, CachedToken>()
  private redisCache: RedisClient

  async get(tokenHash: string): Promise<TokenPair | null> {
    // L1: Memory cache (fastest)
    const memCached = this.memoryCache.get(tokenHash)
    if (memCached && !this.isExpired(memCached)) {
      return memCached.tokens
    }

    // L2: Redis cache
    const redisCached = await this.redisCache.get(`token:${tokenHash}`)
    if (redisCached) {
      const parsed = JSON.parse(redisCached)
      this.memoryCache.set(tokenHash, parsed) // Populate L1
      return parsed.tokens
    }

    return null
  }

  async set(tokenHash: string, tokens: TokenPair, ttl: number): Promise<void> {
    const cached: CachedToken = {
      tokens,
      expiresAt: Date.now() + ttl * 1000,
    }

    // Set in both caches
    this.memoryCache.set(tokenHash, cached)
    await this.redisCache.setex(`token:${tokenHash}`, ttl, JSON.stringify(cached))
  }
}
```

### 2. Connection Pooling

```typescript
// Firebase Admin connection pool
export class FirebaseConnectionPool {
  private readonly maxConnections = 10
  private connections: FirebaseAdmin[] = []
  private currentIndex = 0

  constructor() {
    for (let i = 0; i < this.maxConnections; i++) {
      this.connections.push(new FirebaseAdmin())
    }
  }

  getConnection(): FirebaseAdmin {
    const connection = this.connections[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.maxConnections
    return connection
  }
}
```

## Troubleshooting

### Common Issues

1. **Token Verification Failures**
   - Check Firebase project configuration
   - Verify service account credentials
   - Ensure system time is synchronized

2. **CORS Errors**
   - Verify allowed origins in API configuration
   - Check Firebase auth domain settings
   - Ensure credentials are included in requests

3. **Rate Limiting**
   - Implement exponential backoff
   - Use token caching effectively
   - Monitor usage patterns

4. **Performance Issues**
   - Enable connection pooling
   - Implement proper caching strategy
   - Use regional Firebase endpoints

### Debug Mode

```typescript
// Enable detailed logging
if (process.env.AUTH_DEBUG === 'true') {
  FirebaseAdmin.enableDebugLogging()

  // Log all auth attempts
  authService.on('auth:attempt', (event) => {
    logger.debug('Auth attempt', {
      provider: event.provider,
      userId: event.userId,
      timestamp: event.timestamp,
    })
  })
}
```

## Best Practices Summary

1. **Security First**
   - Always verify tokens server-side
   - Implement proper rate limiting
   - Use secure token storage
   - Regular security audits

2. **Performance**
   - Cache tokens appropriately
   - Use connection pooling
   - Implement circuit breakers
   - Monitor latency metrics

3. **Reliability**
   - Handle token refresh gracefully
   - Implement retry logic
   - Provide fallback mechanisms
   - Test edge cases thoroughly

4. **Maintainability**
   - Follow clean architecture principles
   - Keep Firebase logic isolated
   - Document all custom claims
   - Version security rules

This comprehensive guide provides everything needed to implement and maintain Firebase Authentication in the Pika platform while maintaining flexibility, security, and performance.
