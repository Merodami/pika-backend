# Flutter Implementation Guide

## Overview

This guide provides comprehensive implementation patterns for Flutter development in the Pika project, covering authentication, clean architecture, state management, and best practices.

## Architecture Overview

The Flutter app follows Clean Architecture principles with clear separation of concerns:

```
lib/
├── core/                     # Core functionality & shared utilities
│   ├── config/              # App configuration
│   ├── providers/           # Global Riverpod providers
│   ├── routing/             # Navigation setup
│   ├── services/            # Core services (API, storage, etc.)
│   └── theme/               # UI themes
├── features/                # Feature modules
│   └── [feature]/
│       ├── domain/          # Business logic layer
│       │   ├── entities/    # Business entities
│       │   ├── repositories/# Repository interfaces
│       │   └── usecases/    # Business use cases
│       ├── data/            # Data layer
│       │   ├── datasources/ # Remote/local data sources
│       │   ├── models/      # Data models (DTOs)
│       │   └── repositories/# Repository implementations
│       └── presentation/    # UI layer
│           ├── providers/   # State management
│           ├── screens/     # Screen widgets
│           └── widgets/     # Reusable widgets
└── shared/                  # Shared widgets & utilities
```

## Authentication Implementation

### 1. Backend Integration Architecture

The authentication system integrates with the existing backend through a hybrid approach:

- **Backend JWT**: Primary authentication using JWT tokens
- **Firebase**: Secondary authentication for social providers and real-time features
- **Token Exchange**: Firebase tokens are exchanged for backend JWT tokens

### 2. Secure Token Storage

```dart
// lib/core/services/secure_storage_service.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: IOSAccessibility.first_unlock_this_device,
    ),
  );

  // Keys
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'user_data';

  // Token operations
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<AuthTokens?> getTokens() async {
    final accessToken = await _storage.read(key: _accessTokenKey);
    final refreshToken = await _storage.read(key: _refreshTokenKey);

    if (accessToken == null || refreshToken == null) {
      return null;
    }

    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // Biometric protection
  Future<void> enableBiometricProtection() async {
    // Platform-specific biometric setup
    if (Platform.isIOS) {
      await _storage.write(
        key: 'biometric_enabled',
        value: 'true',
        iOptions: IOSOptions(
          accessibility: IOSAccessibility.first_unlock_this_device,
          biometry: IOSBiometry.faceID,
        ),
      );
    }
  }
}
```

### 3. API Client with Auto-Refresh

```dart
// lib/core/services/api/api_client.dart
class ApiClient {
  final Dio _dio;
  final SecureStorageService _storage;
  final AuthRepository _authRepository;

  static const String baseUrl = 'http://localhost:3000/api/v1';

  ApiClient({
    required SecureStorageService storage,
    required AuthRepository authRepository,
  }) : _storage = storage, _authRepository = authRepository {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request interceptor
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          // Skip auth for public endpoints
          if (_isPublicEndpoint(options.path)) {
            return handler.next(options);
          }

          // Add auth header
          final tokens = await _storage.getTokens();
          if (tokens != null) {
            options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
            options.headers['X-Correlation-ID'] = _generateCorrelationId();
          }

          handler.next(options);
        },

        onError: (error, handler) async {
          // Handle 401 with token refresh
          if (error.response?.statusCode == 401 &&
              !_isPublicEndpoint(error.requestOptions.path)) {

            try {
              final tokens = await _storage.getTokens();
              if (tokens?.refreshToken != null) {
                // Attempt token refresh
                final result = await _authRepository.refreshTokens(
                  refreshToken: tokens!.refreshToken,
                );

                await result.fold(
                  (failure) async {
                    // Refresh failed, clear tokens
                    await _storage.clearAll();
                    handler.next(error);
                  },
                  (newTokens) async {
                    // Save new tokens
                    await _storage.saveTokens(
                      accessToken: newTokens.accessToken,
                      refreshToken: newTokens.refreshToken,
                    );

                    // Retry original request
                    final response = await _retryRequest(
                      error.requestOptions,
                      newTokens.accessToken,
                    );
                    handler.resolve(response);
                  },
                );
                return;
              }
            } catch (e) {
              // Token refresh failed
              await _storage.clearAll();
            }
          }

          handler.next(error);
        },
      ),
    );

    // Logging interceptor
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ));
    }
  }

  Future<Response<dynamic>> _retryRequest(
    RequestOptions requestOptions,
    String newAccessToken,
  ) async {
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        'Authorization': 'Bearer $newAccessToken',
      },
    );

    return await _dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  bool _isPublicEndpoint(String path) {
    const publicPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    return publicPaths.any((p) => path.contains(p));
  }

  String _generateCorrelationId() {
    return '${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(999999)}';
  }
}
```

### 4. Firebase Integration with Clean Architecture

```dart
// lib/features/auth/domain/repositories/auth_repository.dart
abstract class AuthRepository {
  // Traditional auth
  Future<Either<AuthFailure, AuthResponse>> signIn({
    required String email,
    required String password,
  });

  Future<Either<AuthFailure, AuthResponse>> register({
    required RegisterRequest request,
  });

  // Firebase auth
  Future<Either<AuthFailure, AuthResponse>> signInWithGoogle();
  Future<Either<AuthFailure, AuthResponse>> signInWithApple();
  Future<Either<AuthFailure, AuthResponse>> signInWithFacebook();

  // Token management
  Future<Either<AuthFailure, TokenResponse>> refreshTokens({
    required String refreshToken,
  });

  Future<Either<AuthFailure, String>> getFirebaseCustomToken();

  // State management
  Stream<AuthUser?> get authStateChanges;
  Future<void> signOut();
}

// lib/features/auth/data/repositories/auth_repository_impl.dart
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;
  final FirebaseAuthService _firebaseService;
  final SecureStorageService _storage;

  final _authStateController = StreamController<AuthUser?>.broadcast();

  @override
  Future<Either<AuthFailure, AuthResponse>> signInWithGoogle() async {
    try {
      // 1. Sign in with Firebase
      final googleAuth = await _firebaseService.signInWithGoogle();
      if (googleAuth == null) {
        return left(const AuthFailure.cancelled());
      }

      // 2. Get Firebase ID token
      final idToken = await googleAuth.user.getIdToken();

      // 3. Exchange with backend
      final response = await _remoteDataSource.exchangeFirebaseToken(
        firebaseIdToken: idToken,
        provider: 'google',
        deviceInfo: await _getDeviceInfo(),
      );

      // 4. Save tokens securely
      await _storage.saveTokens(
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      );

      // 5. Save user locally
      await _localDataSource.saveUser(response.user);

      // 6. Update auth state
      _authStateController.add(response.user.toDomain());

      return right(AuthResponse(
        user: response.user.toDomain(),
        tokens: response.tokens.toDomain(),
      ));
    } on FirebaseAuthException catch (e) {
      return left(_mapFirebaseError(e));
    } catch (e) {
      return left(AuthFailure.unexpected(e.toString()));
    }
  }

  AuthFailure _mapFirebaseError(FirebaseAuthException e) {
    switch (e.code) {
      case 'account-exists-with-different-credential':
        return const AuthFailure.accountExistsWithDifferentCredential();
      case 'invalid-credential':
        return const AuthFailure.invalidCredential();
      case 'user-disabled':
        return const AuthFailure.userDisabled();
      case 'user-not-found':
        return const AuthFailure.userNotFound();
      case 'wrong-password':
        return const AuthFailure.wrongPassword();
      case 'invalid-verification-code':
        return const AuthFailure.invalidVerificationCode();
      case 'invalid-verification-id':
        return const AuthFailure.invalidVerificationId();
      default:
        return AuthFailure.serverError(e.message ?? 'Firebase auth error');
    }
  }
}
```

### 5. State Management with Riverpod

```dart
// lib/features/auth/presentation/providers/auth_provider.dart
@riverpod
class AuthNotifier extends _$AuthNotifier {
  Timer? _tokenRefreshTimer;
  StreamSubscription? _authStateSubscription;

  @override
  AuthState build() {
    // Initialize auth state
    _initializeAuthState();

    // Listen for app lifecycle changes
    ref.onDispose(() {
      _tokenRefreshTimer?.cancel();
      _authStateSubscription?.cancel();
    });

    return const AuthState.initial();
  }

  void _initializeAuthState() async {
    final authRepository = ref.read(authRepositoryProvider);

    // Check for existing session
    final currentUser = await authRepository.getCurrentUser();
    if (currentUser != null) {
      state = AuthState.authenticated(currentUser);
      _scheduleTokenRefresh(currentUser.tokens);
    }

    // Listen to auth state changes
    _authStateSubscription = authRepository.authStateChanges.listen(
      (user) {
        if (user != null) {
          state = AuthState.authenticated(user);
          _scheduleTokenRefresh(user.tokens);
        } else {
          state = const AuthState.unauthenticated();
          _tokenRefreshTimer?.cancel();
        }
      },
      onError: (error) {
        state = AuthState.error(AuthFailure.unexpected(error.toString()));
      },
    );
  }

  void _scheduleTokenRefresh(AuthTokens tokens) {
    _tokenRefreshTimer?.cancel();

    // Calculate refresh time (5 minutes before expiry)
    final now = DateTime.now();
    final expiryTime = JwtDecoder.getExpirationDate(tokens.accessToken);
    final refreshTime = expiryTime.subtract(const Duration(minutes: 5));
    final timeUntilRefresh = refreshTime.difference(now);

    if (timeUntilRefresh.isNegative) {
      // Token expired, refresh immediately
      _refreshTokens();
    } else {
      // Schedule refresh
      _tokenRefreshTimer = Timer(timeUntilRefresh, _refreshTokens);
    }
  }

  Future<void> _refreshTokens() async {
    final authRepository = ref.read(authRepositoryProvider);
    final storage = ref.read(secureStorageProvider);

    final tokens = await storage.getTokens();
    if (tokens?.refreshToken == null) {
      await signOut();
      return;
    }

    final result = await authRepository.refreshTokens(
      refreshToken: tokens!.refreshToken,
    );

    result.fold(
      (failure) => signOut(),
      (newTokens) => _scheduleTokenRefresh(newTokens),
    );
  }

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    state = const AuthState.loading();

    final authRepository = ref.read(authRepositoryProvider);
    final result = await authRepository.signIn(
      email: email,
      password: password,
    );

    result.fold(
      (failure) => state = AuthState.error(failure),
      (response) {
        // State updated via auth stream
      },
    );
  }

  Future<void> signInWithGoogle() async {
    state = const AuthState.loading();

    final authRepository = ref.read(authRepositoryProvider);
    final result = await authRepository.signInWithGoogle();

    result.fold(
      (failure) => state = AuthState.error(failure),
      (response) {
        // State updated via auth stream
      },
    );
  }

  Future<void> signOut() async {
    final authRepository = ref.read(authRepositoryProvider);
    await authRepository.signOut();

    _tokenRefreshTimer?.cancel();
    state = const AuthState.unauthenticated();
  }
}

// Auth state definition
@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = _Initial;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.authenticated(AuthUser user) = _Authenticated;
  const factory AuthState.unauthenticated() = _Unauthenticated;
  const factory AuthState.error(AuthFailure failure) = _Error;
}
```

## Development Workflow

### Quick Start Commands

```bash
# Initial setup
yarn flutter:setup

# Development
yarn flutter:web          # Web development
yarn flutter:ios          # iOS Simulator
yarn flutter:ios:device   # Physical iPhone
yarn flutter:android      # Android device

# Maintenance
yarn flutter:clean        # Clean build
yarn flutter:build        # Generate code
yarn flutter:reset        # Full reset
```

### Project Structure Best Practices

1. **Feature-First Organization**: Each feature is self-contained with its own layers
2. **Clean Architecture**: Strict separation between domain, data, and presentation
3. **Dependency Injection**: Use Riverpod providers for all dependencies
4. **Error Handling**: Use Either type for explicit error handling
5. **State Management**: Reactive state with Riverpod notifiers

### Code Generation

The project uses several code generation tools:

```bash
# Run all generators
yarn flutter:build

# Specific generators
flutter pub run build_runner build --delete-conflicting-outputs
```

Generated files:

- `.freezed.dart` - Immutable models
- `.g.dart` - JSON serialization
- `.gr.dart` - Auto-route navigation

## Testing Strategy

### Unit Tests

```dart
// Test example for use case
void main() {
  late SignInUseCase signInUseCase;
  late MockAuthRepository mockAuthRepository;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
    signInUseCase = SignInUseCase(mockAuthRepository);
  });

  test('should return user when sign in is successful', () async {
    // Arrange
    when(() => mockAuthRepository.signIn(
      email: any(named: 'email'),
      password: any(named: 'password'),
    )).thenAnswer((_) async => right(mockAuthResponse));

    // Act
    final result = await signInUseCase(
      const SignInParams(email: 'test@example.com', password: 'password'),
    );

    // Assert
    expect(result, right(mockAuthResponse));
    verify(() => mockAuthRepository.signIn(
      email: 'test@example.com',
      password: 'password',
    )).called(1);
  });
}
```

### Widget Tests

```dart
// Test example for login screen
void main() {
  testWidgets('should show error when login fails', (tester) async {
    // Arrange
    final container = ProviderContainer(
      overrides: [
        authNotifierProvider.overrideWith(() => MockAuthNotifier()),
      ],
    );

    // Act
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    await tester.enterText(find.byType(EmailTextField), 'invalid@email');
    await tester.enterText(find.byType(PasswordTextField), 'wrong');
    await tester.tap(find.byType(LoginButton));
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Invalid credentials'), findsOneWidget);
  });
}
```

### Integration Tests

```dart
// Test complete auth flow
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('complete authentication flow', (tester) async {
    // Start app
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    // Navigate to login
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    // Enter credentials
    await tester.enterText(
      find.byKey(const Key('email_field')),
      'test@example.com',
    );
    await tester.enterText(
      find.byKey(const Key('password_field')),
      'password123',
    );

    // Submit
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();

    // Verify navigation to home
    expect(find.byType(HomeScreen), findsOneWidget);
  });
}
```

## Security Best Practices

### 1. Secure Storage

- **Always use flutter_secure_storage** for sensitive data
- **Enable biometric protection** for high-security apps
- **Clear storage on logout** to prevent data leaks

### 2. Network Security

- **Certificate pinning** for production apps
- **Timeout handling** for all network requests
- **Retry logic** with exponential backoff

### 3. Token Management

- **Auto-refresh tokens** before expiry
- **Secure token transmission** with HTTPS only
- **Token validation** before each use

### 4. Error Handling

- **Never expose sensitive errors** to users
- **Log errors securely** without exposing tokens
- **Graceful degradation** for network failures

## Performance Optimization

### 1. State Management

```dart
// Use select to optimize rebuilds
final userName = ref.watch(
  authNotifierProvider.select((state) => state.whenOrNull(
    authenticated: (user) => user.name,
  )),
);
```

### 2. Image Optimization

```dart
// Cache network images
CachedNetworkImage(
  imageUrl: user.profilePicture,
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  cacheManager: DefaultCacheManager(),
);
```

### 3. Lazy Loading

```dart
// Use lazy loading for lists
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ListTile(
      title: Text(items[index].title),
    );
  },
);
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check backend is running: `curl http://localhost:3000/health`
   - For devices, use Mac IP: `ifconfig | grep inet`

2. **Build Failures**

   ```bash
   yarn flutter:reset
   yarn flutter:build
   ```

3. **State Not Updating**
   - Check provider scope
   - Verify state notifier implementation
   - Use Riverpod DevTools

4. **Token Expired Errors**
   - Verify auto-refresh implementation
   - Check token expiry times
   - Ensure secure storage is working

## Best Practices Summary

1. **Architecture**: Follow clean architecture strictly
2. **State Management**: Use Riverpod for all state
3. **Security**: Implement all security measures
4. **Testing**: Write tests for critical paths
5. **Performance**: Optimize for 60fps
6. **Error Handling**: Handle all error cases gracefully
7. **Documentation**: Keep code well-documented

This guide provides a comprehensive foundation for Flutter development in the Pika project, ensuring consistent, secure, and maintainable code across the application.
