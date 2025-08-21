# Flutter Implementation Guide

## Complete Implementation Example

This guide demonstrates how to implement a fully functional Flutter app using the generated types from Zod schemas.

## Project Structure

```
lib/
├── generated/
│   └── api/
│       ├── auth_login.dart
│       ├── auth_register.dart
│       ├── business_business.dart
│       ├── category_category.dart
│       ├── user_profile.dart
│       └── voucher_voucher.dart
├── services/
│   ├── api_service.dart
│   └── auth_service.dart
├── screens/
│   ├── login_screen.dart
│   ├── profile_screen.dart
│   └── business_list_screen.dart
├── models/
│   └── validation_result.dart
└── main.dart
```

## Core Services

### API Service

```dart
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../generated/api/auth_login.dart';
import '../generated/api/user_profile.dart' as api;
import '../generated/api/business_business.dart';

class ApiService {
  final String _baseUrl;
  final http.Client _client;
  String? _accessToken;

  ApiService({
    String? baseUrl,
    http.Client? client,
  })  : _baseUrl = baseUrl ?? 'https://api.pika.com',
        _client = client ?? http.Client();

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
      };

  // Authentication
  Future<AuthTokensResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final authData = AuthTokensResponse.fromJson(jsonDecode(response.body));
      _accessToken = authData.accessToken;
      return authData;
    }
    
    throw ApiException(
      message: 'Login failed',
      statusCode: response.statusCode,
      body: response.body,
    );
  }

  // Profile Management
  Future<api.CurrentUserProfile> getCurrentProfile() async {
    if (_accessToken == null) {
      throw ApiException(message: 'Not authenticated');
    }

    final response = await _client.get(
      Uri.parse('$_baseUrl/users/profile'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return api.CurrentUserProfile.fromJson(jsonDecode(response.body));
    }
    
    throw ApiException(
      message: 'Failed to fetch profile',
      statusCode: response.statusCode,
    );
  }

  // Business Operations
  Future<BusinessListResponse> getBusinesses({
    int page = 1,
    int limit = 20,
    String? search,
    String? categoryId,
    bool? verified,
    SortBy sortBy = SortBy.CREATED_AT,
    SortOrder sortOrder = SortOrder.DESC,
  }) async {
    final queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
      'sortBy': sortByValues.reverse[sortBy],
      'sortOrder': sortOrderValues.reverse[sortOrder],
      if (search != null) 'search': search,
      if (categoryId != null) 'categoryId': categoryId,
      if (verified != null) 'verified': verified.toString(),
    };

    final uri = Uri.parse('$_baseUrl/businesses')
        .replace(queryParameters: queryParams);

    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      return BusinessListResponse.fromJson(jsonDecode(response.body));
    }
    
    throw ApiException(
      message: 'Failed to fetch businesses',
      statusCode: response.statusCode,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? body;

  const ApiException({
    required this.message,
    this.statusCode,
    this.body,
  });

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}
```

### Authentication Service

```dart
// lib/services/auth_service.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../generated/api/auth_login.dart';
import '../generated/api/user_profile.dart' as api;
import 'api_service.dart';

class AuthService {
  final ApiService _apiService;
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userProfileKey = 'user_profile';

  AuthService(this._apiService);

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      // Authenticate
      final authData = await _apiService.login(
        email: email,
        password: password,
      );

      // Store tokens
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_accessTokenKey, authData.accessToken);
      await prefs.setString(_refreshTokenKey, authData.refreshToken);

      // Set token in API service
      _apiService.setAccessToken(authData.accessToken);

      // Fetch user profile
      try {
        final profile = await _apiService.getCurrentProfile();
        await prefs.setString(
          _userProfileKey, 
          jsonEncode(profile.toJson())
        );
        
        return AuthResult.success(
          tokens: authData,
          profile: profile,
        );
      } catch (profileError) {
        // Login succeeded but profile fetch failed
        return AuthResult.success(
          tokens: authData,
          profile: null,
          warning: 'Failed to load profile: $profileError',
        );
      }
    } catch (e) {
      return AuthResult.failure(e.toString());
    }
  }

  Future<bool> isLoggedIn() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_accessTokenKey);
      
      if (token == null) return false;

      _apiService.setAccessToken(token);
      await _apiService.getCurrentProfile();
      return true;
    } catch (e) {
      await logout();
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.remove(_accessTokenKey),
      prefs.remove(_refreshTokenKey),
      prefs.remove(_userProfileKey),
    ]);
    _apiService.clearAuth();
  }
}

class AuthResult {
  final bool isSuccess;
  final AuthTokensResponse? tokens;
  final api.CurrentUserProfile? profile;
  final String? error;
  final String? warning;

  const AuthResult._({
    required this.isSuccess,
    this.tokens,
    this.profile,
    this.error,
    this.warning,
  });

  factory AuthResult.success({
    required AuthTokensResponse tokens,
    api.CurrentUserProfile? profile,
    String? warning,
  }) => AuthResult._(
    isSuccess: true,
    tokens: tokens,
    profile: profile,
    warning: warning,
  );

  factory AuthResult.failure(String error) => AuthResult._(
    isSuccess: false,
    error: error,
  );
}
```

## Validation Layer

```dart
// lib/models/validation_result.dart
class ValidationResult {
  final bool isValid;
  final List<String> errors;

  const ValidationResult({
    required this.isValid,
    this.errors = const [],
  });

  const ValidationResult.valid() : this(isValid: true);
  
  const ValidationResult.invalid(List<String> errors) 
      : this(isValid: false, errors: errors);

  ValidationResult combine(ValidationResult other) {
    if (isValid && other.isValid) {
      return const ValidationResult.valid();
    }
    return ValidationResult.invalid([...errors, ...other.errors]);
  }
}

class FormValidator {
  static ValidationResult validateEmail(String? email) {
    if (email == null || email.trim().isEmpty) {
      return const ValidationResult.invalid(['Email is required']);
    }

    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(email.trim())) {
      return const ValidationResult.invalid(
        ['Please enter a valid email address']
      );
    }

    return const ValidationResult.valid();
  }

  static ValidationResult validatePassword(String? password) {
    final errors = <String>[];
    
    if (password == null || password.isEmpty) {
      return const ValidationResult.invalid(['Password is required']);
    }

    if (password.length < 8) {
      errors.add('Password must be at least 8 characters long');
    }

    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      errors.add('Password must contain at least one uppercase letter');
    }

    if (!RegExp(r'[a-z]').hasMatch(password)) {
      errors.add('Password must contain at least one lowercase letter');
    }

    if (!RegExp(r'[0-9]').hasMatch(password)) {
      errors.add('Password must contain at least one number');
    }

    return errors.isEmpty 
        ? const ValidationResult.valid()
        : ValidationResult.invalid(errors);
  }

  static ValidationResult validatePhoneNumber(String? phone) {
    if (phone == null || phone.trim().isEmpty) {
      return const ValidationResult.valid(); // Optional field
    }

    // E.164 format validation
    final e164Regex = RegExp(r'^\+[1-9]\d{1,14}$');
    if (!e164Regex.hasMatch(phone.trim())) {
      return const ValidationResult.invalid([
        'Phone number must be in E.164 format (e.g., +1234567890)'
      ]);
    }

    return const ValidationResult.valid();
  }
}
```

## UI Implementation

### Login Screen Example

```dart
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../models/validation_result.dart';

class LoginScreen extends StatefulWidget {
  final AuthService authService;

  const LoginScreen({super.key, required this.authService});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await widget.authService.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (result.isSuccess) {
      // Navigate to home
      Navigator.of(context).pushReplacementNamed('/home');
      
      if (result.warning != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.warning!)),
        );
      }
    } else {
      setState(() {
        _errorMessage = result.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    final result = FormValidator.validateEmail(value);
                    return result.isValid ? null : result.errors.first;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                  validator: (value) {
                    final result = FormValidator.validatePassword(value);
                    return result.isValid ? null : result.errors.first;
                  },
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    child: _isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Login'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

### Business List with Pagination

```dart
// lib/screens/business_list_screen.dart
class BusinessListScreen extends StatefulWidget {
  final ApiService apiService;

  const BusinessListScreen({super.key, required this.apiService});

  @override
  State<BusinessListScreen> createState() => _BusinessListScreenState();
}

class _BusinessListScreenState extends State<BusinessListScreen> {
  BusinessListResponse? _businessList;
  bool _isLoading = false;
  String? _error;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadBusinesses();
  }

  Future<void> _loadBusinesses({bool refresh = false}) async {
    if (!refresh && _isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
      if (refresh) _businessList = null;
    });

    try {
      final response = await widget.apiService.getBusinesses(
        page: 1,
        limit: 20,
        search: _searchController.text.trim().isEmpty 
            ? null 
            : _searchController.text.trim(),
      );

      setState(() {
        _businessList = response;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreBusinesses() async {
    if (_businessList == null || 
        !_businessList!.pagination.hasNext || 
        _isLoading) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await widget.apiService.getBusinesses(
        page: _businessList!.pagination.page + 1,
        limit: 20,
      );

      setState(() {
        _businessList = BusinessListResponse(
          data: [..._businessList!.data, ...response.data],
          pagination: response.pagination,
        );
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Businesses')),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search businesses...',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        onPressed: () {
                          _searchController.clear();
                          _loadBusinesses(refresh: true);
                        },
                        icon: const Icon(Icons.clear),
                      )
                    : null,
              ),
              onSubmitted: (_) => _loadBusinesses(refresh: true),
            ),
          ),
          
          // Business List
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Error: $_error'),
            ElevatedButton(
              onPressed: () => _loadBusinesses(refresh: true),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_businessList == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_businessList!.data.isEmpty) {
      return const Center(child: Text('No businesses found'));
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (scrollInfo) {
        if (scrollInfo.metrics.pixels == 
            scrollInfo.metrics.maxScrollExtent &&
            !_isLoading &&
            _businessList!.pagination.hasNext) {
          _loadMoreBusinesses();
        }
        return false;
      },
      child: ListView.builder(
        itemCount: _businessList!.data.length + 
                   (_businessList!.pagination.hasNext ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= _businessList!.data.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          
          return _buildBusinessCard(_businessList!.data[index]);
        },
      ),
    );
  }

  Widget _buildBusinessCard(Datum business) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        title: Text(business.businessNameKey),
        subtitle: Text('Rating: ${business.avgRating.toStringAsFixed(1)}'),
        trailing: business.verified 
            ? const Icon(Icons.verified, color: Colors.blue)
            : null,
        onTap: () {
          // Navigate to business detail
          Navigator.of(context).pushNamed(
            '/business-detail',
            arguments: business.id,
          );
        },
      ),
    );
  }
}
```

## Testing Strategy

### Unit Tests

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;

class MockClient extends Mock implements http.Client {}

void main() {
  group('ApiService Tests', () {
    late ApiService apiService;
    late MockClient mockClient;

    setUp(() {
      mockClient = MockClient();
      apiService = ApiService(client: mockClient);
    });

    test('login returns AuthTokensResponse on success', () async {
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(
                '{"accessToken": "token", "refreshToken": "refresh", '
                '"expiresIn": 3600, "tokenType": "Bearer"}',
                200,
              ));

      final response = await apiService.login(
        email: 'test@example.com',
        password: 'password123',
      );

      expect(response.accessToken, equals('token'));
      expect(response.tokenType, equals(TokenType.BEARER));
    });

    test('login throws ApiException on failure', () async {
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response('Unauthorized', 401));

      expect(
        () => apiService.login(
          email: 'test@example.com',
          password: 'wrong',
        ),
        throwsA(isA<ApiException>()),
      );
    });
  });
}
```

### Integration Tests

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('End-to-end tests', () {
    testWidgets('User can login and view profile', (tester) async {
      await tester.pumpWidget(MyApp());

      // Find and tap email field
      await tester.tap(find.byType(TextFormField).first);
      await tester.enterText(find.byType(TextFormField).first, 'test@example.com');

      // Find and tap password field
      await tester.tap(find.byType(TextFormField).last);
      await tester.enterText(find.byType(TextFormField).last, 'password123');

      // Tap login button
      await tester.tap(find.text('Login'));
      await tester.pumpAndSettle();

      // Verify navigation to home
      expect(find.text('Welcome'), findsOneWidget);
    });
  });
}
```

## Performance Optimization

### 1. Caching Strategy
```dart
class CachedApiService extends ApiService {
  final Duration cacheDuration;
  final Map<String, CachedResponse> _cache = {};

  Future<T> _cachedRequest<T>(
    String key,
    Future<T> Function() request,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final cached = _cache[key];
    if (cached != null && !cached.isExpired) {
      return fromJson(cached.data);
    }

    final response = await request();
    _cache[key] = CachedResponse(
      data: (response as dynamic).toJson(),
      timestamp: DateTime.now(),
    );
    
    return response;
  }
}
```

### 2. Lazy Loading
```dart
class LazyBusinessList extends StatefulWidget {
  @override
  State<LazyBusinessList> createState() => _LazyBusinessListState();
}

class _LazyBusinessListState extends State<LazyBusinessList> 
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return ListView.builder(
      itemBuilder: (context, index) {
        // Lazy load items as needed
        return FutureBuilder(
          future: _loadBusinessAtIndex(index),
          builder: (context, snapshot) {
            if (snapshot.hasData) {
              return BusinessCard(business: snapshot.data!);
            }
            return const ShimmerCard();
          },
        );
      },
    );
  }
}
```

## Error Handling Patterns

### Global Error Handler
```dart
class ErrorHandler {
  static void handleApiError(BuildContext context, dynamic error) {
    String message = 'An unexpected error occurred';
    
    if (error is ApiException) {
      switch (error.statusCode) {
        case 401:
          message = 'Please login again';
          Navigator.of(context).pushReplacementNamed('/login');
          break;
        case 403:
          message = 'You don\'t have permission for this action';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 500:
          message = 'Server error. Please try again later';
          break;
        default:
          message = error.message;
      }
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }
}
```

## State Management Integration

### With Provider
```dart
class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  api.CurrentUserProfile? _profile;
  bool _isAuthenticated = false;

  AuthProvider(this._authService);

  api.CurrentUserProfile? get profile => _profile;
  bool get isAuthenticated => _isAuthenticated;

  Future<void> login(String email, String password) async {
    final result = await _authService.login(
      email: email,
      password: password,
    );

    if (result.isSuccess) {
      _profile = result.profile;
      _isAuthenticated = true;
      notifyListeners();
    } else {
      throw Exception(result.error);
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _profile = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
```

### With Riverpod
```dart
final authServiceProvider = Provider((ref) => AuthService(
  ref.watch(apiServiceProvider),
));

final currentUserProvider = FutureProvider<api.CurrentUserProfile?>((ref) async {
  final authService = ref.watch(authServiceProvider);
  return authService.getCachedProfile();
});

final businessListProvider = FutureProvider.family<BusinessListResponse, int>(
  (ref, page) async {
    final apiService = ref.watch(apiServiceProvider);
    return apiService.getBusinesses(page: page);
  },
);
```

## Deployment Checklist

- [ ] Generated types are up-to-date
- [ ] API base URL is configured for production
- [ ] Error handling covers all edge cases
- [ ] Sensitive data is not logged
- [ ] Token refresh mechanism is implemented
- [ ] Offline mode handling is in place
- [ ] Performance optimizations are applied
- [ ] All tests are passing
- [ ] Code is properly documented
- [ ] Security best practices are followed