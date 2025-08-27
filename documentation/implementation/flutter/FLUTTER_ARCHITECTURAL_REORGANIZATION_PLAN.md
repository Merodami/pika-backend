# VoucherBook Flutter - Modern Architectural Reorganization Plan

**Version**: 2.0.0  
**Date**: August 24, 2025  
**Status**: IMPLEMENTATION READY  
**Architecture Pattern**: Clean Architecture with Feature-First Modular Design

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Vision & Principles](#architecture-vision--principles)
3. [Critical Issues Resolution](#critical-issues-resolution)
4. [New Architecture Structure](#new-architecture-structure)
5. [Multi-Role System Design](#multi-role-system-design)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Standards](#technical-standards)

---

## Executive Summary

This plan establishes a **production-grade, scalable architecture** for VoucherBook that supports multi-role users (customers and business owners), implements security best practices, and follows industry standards for maintainability and testability.

### Key Objectives

- **Eliminate all security vulnerabilities** through proper configuration management
- **Implement multi-role architecture** supporting customer/business owner contexts
- **Establish 80%+ test coverage** with automated quality gates
- **Create modular, feature-first architecture** for team scalability
- **Implement offline-first capabilities** with proper state synchronization

---

## Architecture Vision & Principles

### Core Architectural Principles

```yaml
principles:
  separation_of_concerns:
    - Each layer has single responsibility
    - Dependencies flow inward only
    - Business logic independent of frameworks

  dependency_inversion:
    - Depend on abstractions, not concretions
    - High-level modules independent of low-level modules

  single_source_of_truth:
    - One canonical data source per entity
    - Consistent state management patterns
    - Centralized configuration management

  testability_first:
    - All business logic must be testable
    - Dependency injection for all services
    - Mock-friendly interfaces

  security_by_design:
    - Zero hardcoded secrets
    - Principle of least privilege
    - Defense in depth
```

### Technology Standards

```dart
// Standardized technology stack
const techStack = {
  'state_management': 'Riverpod 2.6+',        // Single pattern throughout
  'navigation': 'Go Router 16+',               // Type-safe routing
  'networking': 'Dio + Retrofit',              // With interceptors
  'local_storage': 'Drift',                    // Type-safe SQLite
  'caching': 'Hive',                          // Fast key-value storage
  'dependency_injection': 'GetIt + Injectable', // With code generation
  'testing': 'Mocktail + Patrol',             // Modern testing tools
  'analytics': 'Firebase Analytics',           // With custom events
  'monitoring': 'Sentry',                      // Error tracking
  'code_quality': 'Very Good Analysis',        // Strict linting
};
```

---

## Critical Issues Resolution

### 1. Security Vulnerabilities - IMMEDIATE

#### Remove All Hardcoded Credentials

```dart
// ❌ CURRENT - CRITICAL SECURITY ISSUE
class LoginScreen extends StatelessWidget {
  final emailController = TextEditingController(text: 'admin@example.com');
  final passwordController = TextEditingController(text: 'admin123');
}

// ✅ NEW - Secure Implementation
// lib/core/config/app_config.dart
@singleton
class AppConfig {
  // Environment-based configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '', // No default in production
  );

  static const bool isProduction = bool.fromEnvironment(
    'PRODUCTION',
    defaultValue: false,
  );

  // Secure storage for sensitive data
  final FlutterSecureStorage _secureStorage;

  AppConfig(this._secureStorage);

  Future<String?> getApiKey() async {
    return await _secureStorage.read(key: 'api_key');
  }

  // Never store credentials in code
  static void validateConfiguration() {
    if (isProduction && apiBaseUrl.isEmpty) {
      throw ConfigurationException('API_BASE_URL must be set in production');
    }
  }
}
```

#### Implement Secure Build Configuration

```dart
// lib/core/config/build_config.dart
abstract class BuildConfig {
  static const BuildFlavor flavor = BuildFlavor.fromEnvironment();

  static AppEnvironment get environment {
    switch (flavor) {
      case BuildFlavor.development:
        return DevelopmentEnvironment();
      case BuildFlavor.staging:
        return StagingEnvironment();
      case BuildFlavor.production:
        return ProductionEnvironment();
    }
  }
}

// lib/core/config/environments/production_environment.dart
class ProductionEnvironment extends AppEnvironment {
  @override
  String get apiBaseUrl => const String.fromEnvironment('API_BASE_URL');

  @override
  bool get enableLogging => false;

  @override
  bool get enableDebugMode => false;

  @override
  SecurityConfig get security => ProductionSecurityConfig(
    enableCertificatePinning: true,
    apiTimeoutSeconds: 30,
    maxRetryAttempts: 3,
    enableRequestSigning: true,
  );
}
```

### 2. Test Coverage - CRITICAL

#### Comprehensive Testing Architecture

```dart
// test/testing_architecture.dart
/*
 * Testing Architecture Standards
 *
 * Coverage Requirements:
 * - Domain Layer: 100% coverage (business logic)
 * - Data Layer: 90% coverage (repositories, data sources)
 * - Presentation Layer: 80% coverage (widgets, view models)
 *
 * Test Types:
 * 1. Unit Tests - Business logic, utilities
 * 2. Widget Tests - UI components
 * 3. Integration Tests - Feature flows
 * 4. Golden Tests - Visual regression
 * 5. Performance Tests - Critical paths
 */

// test/fixtures/fixture_reader.dart
class FixtureReader {
  static String fixture(String name) {
    return File('test/fixtures/$name').readAsStringSync();
  }

  static Map<String, dynamic> jsonFixture(String name) {
    return json.decode(fixture(name));
  }
}

// test/helpers/test_injection.dart
class TestInjection {
  static Future<void> init() async {
    // Register test dependencies
    getIt.registerLazySingleton<Dio>(() => MockDio());
    getIt.registerLazySingleton<LocalStorage>(() => MockLocalStorage());
    // ... other mocks
  }
}

// Example comprehensive test
// test/features/voucher/domain/usecases/redeem_voucher_test.dart
@GenerateMocks([VoucherRepository, AnalyticsService])
void main() {
  late RedeemVoucherUseCase useCase;
  late MockVoucherRepository mockRepository;
  late MockAnalyticsService mockAnalytics;

  setUp(() {
    mockRepository = MockVoucherRepository();
    mockAnalytics = MockAnalyticsService();
    useCase = RedeemVoucherUseCase(mockRepository, mockAnalytics);
  });

  group('RedeemVoucherUseCase', () {
    test('should redeem voucher successfully with valid QR code', () async {
      // Arrange
      const qrCode = 'valid_qr_code';
      final voucher = VoucherFactory.create();

      when(() => mockRepository.redeemVoucher(qrCode))
          .thenAnswer((_) async => Right(voucher));

      // Act
      final result = await useCase(RedeemVoucherParams(qrCode: qrCode));

      // Assert
      expect(result, Right(voucher));
      verify(() => mockAnalytics.trackVoucherRedemption(voucher)).called(1);
    });

    test('should return failure when QR code is invalid', () async {
      // Test invalid QR code handling
    });

    test('should handle network errors gracefully', () async {
      // Test network error handling
    });
  });
}
```

---

## New Architecture Structure

### Feature-First Modular Architecture

```
lib/
├── app/                           # Application layer
│   ├── app.dart                  # Main app widget
│   ├── router/                   # Routing configuration
│   │   ├── app_router.dart
│   │   ├── route_guards.dart
│   │   └── route_observers.dart
│   └── theme/                    # Theme configuration
│       ├── app_theme.dart
│       └── app_colors.dart
│
├── core/                          # Core/Shared layer
│   ├── config/                   # Configuration management
│   │   ├── app_config.dart
│   │   ├── build_config.dart
│   │   └── environments/
│   │       ├── base_environment.dart
│   │       ├── development_environment.dart
│   │       ├── staging_environment.dart
│   │       └── production_environment.dart
│   │
│   ├── di/                       # Dependency injection
│   │   ├── injection.dart
│   │   ├── injection.config.dart
│   │   └── modules/
│   │       ├── network_module.dart
│   │       ├── storage_module.dart
│   │       └── service_module.dart
│   │
│   ├── network/                  # Network configuration
│   │   ├── api_client.dart
│   │   ├── interceptors/
│   │   │   ├── auth_interceptor.dart
│   │   │   ├── logging_interceptor.dart
│   │   │   ├── retry_interceptor.dart
│   │   │   └── cache_interceptor.dart
│   │   └── exceptions/
│   │       ├── api_exception.dart
│   │       └── network_exception.dart
│   │
│   ├── storage/                  # Local storage
│   │   ├── secure_storage.dart
│   │   ├── cache_manager.dart
│   │   └── database/
│   │       ├── app_database.dart
│   │       └── daos/
│   │
│   ├── utils/                    # Utilities
│   │   ├── validators/
│   │   ├── formatters/
│   │   ├── extensions/
│   │   └── constants.dart
│   │
│   └── errors/                   # Error handling
│       ├── failures.dart
│       └── exceptions.dart
│
├── features/                      # Feature modules
│   ├── auth/                     # Authentication feature
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── user.dart
│   │   │   │   └── auth_token.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── sign_in.dart
│   │   │       ├── sign_out.dart
│   │   │       └── switch_role.dart
│   │   │
│   │   ├── data/
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository_impl.dart
│   │   │   ├── datasources/
│   │   │   │   ├── auth_remote_datasource.dart
│   │   │   │   └── auth_local_datasource.dart
│   │   │   └── models/
│   │   │       ├── user_model.dart
│   │   │       └── auth_token_model.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── auth_state_provider.dart
│   │       │   └── user_role_provider.dart
│   │       ├── screens/
│   │       │   ├── login_screen.dart
│   │       │   ├── role_selection_screen.dart
│   │       │   └── biometric_setup_screen.dart
│   │       └── widgets/
│   │           ├── social_login_buttons.dart
│   │           └── role_switcher.dart
│   │
│   ├── voucher/                  # Voucher management
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── voucher.dart
│   │   │   │   └── voucher_redemption.dart
│   │   │   ├── repositories/
│   │   │   │   └── voucher_repository.dart
│   │   │   └── usecases/
│   │   │       ├── get_vouchers.dart
│   │   │       ├── redeem_voucher.dart
│   │   │       ├── scan_voucher_qr.dart
│   │   │       └── validate_voucher.dart
│   │   │
│   │   ├── data/
│   │   │   ├── repositories/
│   │   │   │   └── voucher_repository_impl.dart
│   │   │   ├── datasources/
│   │   │   │   ├── voucher_remote_datasource.dart
│   │   │   │   └── voucher_local_datasource.dart
│   │   │   └── models/
│   │   │       └── voucher_model.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── voucher_list_provider.dart
│   │       │   └── voucher_detail_provider.dart
│   │       ├── screens/
│   │       │   ├── voucher_list_screen.dart
│   │       │   ├── voucher_detail_screen.dart
│   │       │   ├── voucher_qr_screen.dart
│   │       │   └── voucher_scanner_screen.dart
│   │       └── widgets/
│   │           ├── voucher_card.dart
│   │           └── qr_code_widget.dart
│   │
│   ├── business/                 # Business management
│   │   ├── domain/
│   │   ├── data/
│   │   └── presentation/
│   │
│   └── shared/                   # Shared feature components
│       ├── widgets/
│       │   ├── loading_indicator.dart
│       │   ├── error_widget.dart
│       │   └── empty_state.dart
│       └── providers/
│           └── connectivity_provider.dart
│
└── l10n/                         # Localization
    ├── app_en.arb
    ├── app_es.arb
    └── app_gn.arb
```

### Domain-Driven Design Implementation

```dart
// lib/features/voucher/domain/entities/voucher.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'voucher.freezed.dart';

@freezed
class Voucher with _$Voucher {
  const factory Voucher({
    required VoucherId id,
    required BusinessId businessId,
    required String title,
    required String description,
    required VoucherTerms terms,
    required DiscountValue discount,
    required VoucherValidity validity,
    required VoucherStatus status,
    VoucherRedemption? redemption,
  }) = _Voucher;

  const Voucher._();

  bool get isValid => validity.isValid && status.isActive;
  bool get isRedeemed => redemption != null;
  bool get canRedeem => isValid && !isRedeemed;
}

// Value Objects
@freezed
class VoucherId with _$VoucherId {
  const factory VoucherId(String value) = _VoucherId;

  factory VoucherId.generate() => VoucherId(const Uuid().v4());
}

@freezed
class DiscountValue with _$DiscountValue {
  const factory DiscountValue.percentage(double value) = PercentageDiscount;
  const factory DiscountValue.fixed(double value, Currency currency) = FixedDiscount;

  const DiscountValue._();

  String get displayValue => when(
    percentage: (value) => '${value.toStringAsFixed(0)}% OFF',
    fixed: (value, currency) => '${currency.symbol}${value.toStringAsFixed(2)} OFF',
  );
}
```

---

## Multi-Role System Design

### Role-Based Architecture

```dart
// lib/features/auth/domain/entities/user_role.dart
enum UserRole {
  customer('customer'),
  businessOwner('business_owner'),
  admin('admin');

  final String value;
  const UserRole(this.value);

  bool get isBusinessOwner => this == UserRole.businessOwner;
  bool get isCustomer => this == UserRole.customer;
  bool get isAdmin => this == UserRole.admin;
}

// lib/features/auth/domain/entities/user_context.dart
@freezed
class UserContext with _$UserContext {
  const factory UserContext({
    required User user,
    required UserRole activeRole,
    required Set<UserRole> availableRoles,
    Business? activeBusiness, // For business owners
  }) = _UserContext;

  const UserContext._();

  bool get canSwitchRoles => availableRoles.length > 1;
  bool get hasBusinessAccess => availableRoles.contains(UserRole.businessOwner);
}

// lib/features/auth/presentation/providers/user_context_provider.dart
@riverpod
class UserContextNotifier extends _$UserContextNotifier {
  @override
  FutureOr<UserContext?> build() async {
    final authState = ref.watch(authStateProvider);

    return authState.maybeWhen(
      authenticated: (user) async {
        final roles = await _fetchUserRoles(user.id);
        final activeBusiness = roles.contains(UserRole.businessOwner)
            ? await _fetchActiveBusiness(user.id)
            : null;

        return UserContext(
          user: user,
          activeRole: user.lastActiveRole ?? UserRole.customer,
          availableRoles: roles,
          activeBusiness: activeBusiness,
        );
      },
      orElse: () => null,
    );
  }

  Future<void> switchRole(UserRole newRole) async {
    final context = state.valueOrNull;
    if (context == null || !context.availableRoles.contains(newRole)) {
      throw InvalidRoleException();
    }

    state = AsyncValue.data(
      context.copyWith(activeRole: newRole),
    );

    // Update UI based on new role
    ref.invalidate(roleBasedNavigationProvider);
  }
}

// lib/app/router/role_based_router.dart
@riverpod
GoRouter roleBasedRouter(RoleBasedRouterRef ref) {
  final userContext = ref.watch(userContextProvider);

  return GoRouter(
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) {
          final role = userContext.valueOrNull?.activeRole;

          return switch (role) {
            UserRole.customer => '/customer/home',
            UserRole.businessOwner => '/business/dashboard',
            UserRole.admin => '/admin/dashboard',
            null => '/auth/login',
          };
        },
      ),
      // Customer routes
      ShellRoute(
        builder: (context, state, child) => CustomerShell(child: child),
        routes: customerRoutes,
      ),
      // Business routes with guards
      ShellRoute(
        builder: (context, state, child) => BusinessShell(child: child),
        routes: businessRoutes,
        redirect: (context, state) {
          if (!userContext.valueOrNull?.hasBusinessAccess ?? false) {
            return '/auth/unauthorized';
          }
          return null;
        },
      ),
    ],
  );
}
```

### Feature Availability by Role

```dart
// lib/features/shared/providers/feature_flags_provider.dart
@riverpod
class FeatureFlags extends _$FeatureFlags {
  @override
  Map<String, bool> build() {
    final userContext = ref.watch(userContextProvider).valueOrNull;

    return switch (userContext?.activeRole) {
      UserRole.customer => {
        'voucher_browsing': true,
        'voucher_redemption': true,
        'voucher_scanning': false,
        'business_management': false,
        'analytics_dashboard': false,
        'voucher_creation': false,
      },
      UserRole.businessOwner => {
        'voucher_browsing': true,
        'voucher_redemption': false,
        'voucher_scanning': true,
        'business_management': true,
        'analytics_dashboard': true,
        'voucher_creation': true,
      },
      UserRole.admin => {
        // All features enabled for admin
        ...Map.fromEntries(
          FeatureFlag.values.map((f) => MapEntry(f.name, true)),
        ),
      },
      null => {
        // Minimal features for unauthenticated users
        'voucher_browsing': true,
        'voucher_redemption': false,
        // ... other features disabled
      },
    };
  }

  bool isEnabled(String feature) => state[feature] ?? false;
}

// Usage in UI
class VoucherDetailScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final features = ref.watch(featureFlagsProvider);

    return Scaffold(
      body: Column(
        children: [
          // Common voucher details
          VoucherInfo(),

          // Role-based actions
          if (features.isEnabled('voucher_redemption'))
            RedeemVoucherButton(),

          if (features.isEnabled('voucher_scanning'))
            ScanVoucherButton(),

          if (features.isEnabled('voucher_creation'))
            EditVoucherButton(),
        ],
      ),
    );
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

#### Week 1: Security & Configuration

```bash
# Day 1-2: Remove all security vulnerabilities
✓ Remove hardcoded credentials
✓ Implement secure storage
✓ Set up environment configuration
✓ Add certificate pinning

# Day 3-4: Configuration management
✓ Create build flavors (dev, staging, prod)
✓ Implement AppConfig with validation
✓ Set up CI/CD secrets management
✓ Add security headers

# Day 5: Testing infrastructure
✓ Set up test framework
✓ Create test utilities and helpers
✓ Implement fixture management
✓ Configure code coverage tools
```

#### Week 2: Core Architecture

```bash
# Day 1-2: Dependency injection setup
✓ Configure GetIt with Injectable
✓ Create service modules
✓ Implement service locator pattern
✓ Add development/production configurations

# Day 3-4: Network layer
✓ Implement Dio configuration
✓ Create interceptors (auth, retry, cache)
✓ Add error handling
✓ Implement offline detection

# Day 5: Local storage
✓ Set up Drift database
✓ Implement Hive caching
✓ Create secure storage wrapper
✓ Add data synchronization
```

### Phase 2: Feature Migration (Week 3-4)

#### Week 3: Auth & User Management

```dart
// Implement multi-role authentication
class AuthenticationMigration {
  static Future<void> migrate() async {
    // 1. Create new auth domain layer
    await createAuthEntities();
    await createAuthUseCases();
    await createAuthRepository();

    // 2. Implement role-based system
    await implementUserContext();
    await createRoleSwitching();
    await addRoleGuards();

    // 3. Update UI for multi-role
    await updateLoginScreen();
    await createRoleSelectionScreen();
    await implementRoleBasedNavigation();

    // 4. Add comprehensive tests
    await writeAuthUnitTests();
    await writeAuthIntegrationTests();
  }
}
```

#### Week 4: Voucher System

```dart
// Complete voucher feature with business support
class VoucherSystemMigration {
  static Future<void> migrate() async {
    // 1. Domain layer
    await createVoucherEntities();
    await implementVoucherUseCases();

    // 2. QR code functionality
    await implementQRGeneration();
    await implementQRScanning();
    await addOfflineQRValidation();

    // 3. Business owner features
    await createVoucherCreation();
    await implementVoucherManagement();
    await addVoucherAnalytics();

    // 4. Customer features
    await improveVoucherBrowsing();
    await implementVoucherRedemption();
    await addVoucherFavorites();
  }
}
```

### Phase 3: Quality & Performance (Week 5-6)

#### Week 5: Testing & Quality

```yaml
# Test coverage targets
coverage_targets:
  domain_layer: 100%
  data_layer: 90%
  presentation_layer: 80%
  overall: 85%

# Test types to implement
test_types:
  - unit_tests: All business logic
  - widget_tests: All screens and components
  - integration_tests: Critical user journeys
  - golden_tests: Visual regression
  - performance_tests: App launch, navigation
```

#### Week 6: Performance & Polish

```dart
// Performance optimizations
class PerformanceOptimization {
  static Future<void> optimize() async {
    // 1. Image optimization
    await implementProgressiveImageLoading();
    await addImageCaching();
    await enableWebPSupport();

    // 2. State management optimization
    await implementSelectiveRebuilds();
    await addProviderCaching();
    await optimizeProviderScopes();

    // 3. Build optimization
    await enableTreeShaking();
    await implementCodeSplitting();
    await reduceAppSize();

    // 4. Runtime optimization
    await implementLazyLoading();
    await addPaginationEverywhere();
    await optimizeAnimations();
  }
}
```

---

## Technical Standards

### Code Quality Standards

```dart
// analysis_options.yaml
analyzer:
  strong-mode:
    implicit-casts: false
    implicit-dynamic: false

  errors:
    missing_required_param: error
    missing_return: error
    todo: warning
    deprecated_member_use_from_same_package: warning

  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"

linter:
  rules:
    # Error Rules
    - always_use_package_imports
    - avoid_dynamic_calls
    - avoid_empty_else
    - avoid_print
    - avoid_relative_lib_imports
    - avoid_returning_null_for_future
    - avoid_slow_async_io
    - avoid_type_to_string
    - avoid_types_as_parameter_names
    - avoid_web_libraries_in_flutter
    - cancel_subscriptions
    - close_sinks
    - comment_references
    - literal_only_boolean_expressions
    - no_adjacent_strings_in_list
    - no_duplicate_case_values
    - test_types_in_equals
    - throw_in_finally
    - unnecessary_statements
    - unrelated_type_equality_checks

    # Style Rules
    - always_declare_return_types
    - always_put_control_body_on_new_line
    - always_put_required_named_parameters_first
    - always_require_non_null_named_parameters
    - annotate_overrides
    - avoid_bool_literals_in_conditional_expressions
    - avoid_catching_errors
    - avoid_classes_with_only_static_members
    - avoid_double_and_int_checks
    - avoid_equals_and_hash_code_on_mutable_classes
    - avoid_field_initializers_in_const_classes
    - avoid_function_literals_in_foreach_calls
    - avoid_implementing_value_types
    - avoid_init_to_null
    - avoid_js_rounded_ints
    - avoid_null_checks_in_equality_operators
    - avoid_positional_boolean_parameters
    - avoid_private_typedef_functions
    - avoid_redundant_argument_values
    - avoid_renaming_method_parameters
    - avoid_return_types_on_setters
    - avoid_returning_null
    - avoid_returning_null_for_void
    - avoid_returning_this
    - avoid_setters_without_getters
    - avoid_shadowing_type_parameters
    - avoid_single_cascade_in_expression_statements
    - avoid_types_on_closure_parameters
    - avoid_unnecessary_containers
    - avoid_unused_constructor_parameters
    - avoid_void_async
    - await_only_futures
    - camel_case_extensions
    - camel_case_types
    - cascade_invocations
    - constant_identifier_names
    - curly_braces_in_flow_control_structures
    - directives_ordering
    - do_not_use_environment
    - empty_catches
    - empty_constructor_bodies
    - exhaustive_cases
    - file_names
    - flutter_style_todos
    - hash_and_equals
    - implementation_imports
    - join_return_with_assignment
    - leading_newlines_in_multiline_strings
    - library_names
    - library_prefixes
    - lines_longer_than_80_chars
    - missing_whitespace_between_adjacent_strings
    - no_default_cases
    - no_logic_in_create_state
    - no_runtimeType_toString
    - non_constant_identifier_names
    - null_closures
    - one_member_abstracts
    - only_throw_errors
    - overridden_fields
    - package_api_docs
    - package_names
    - package_prefixed_library_names
    - parameter_assignments
    - prefer_adjacent_string_concatenation
    - prefer_asserts_in_initializer_lists
    - prefer_asserts_with_message
    - prefer_collection_literals
    - prefer_conditional_assignment
    - prefer_const_constructors
    - prefer_const_constructors_in_immutables
    - prefer_const_declarations
    - prefer_const_literals_to_create_immutables
    - prefer_constructors_over_static_methods
    - prefer_contains
    - prefer_equal_for_default_values
    - prefer_expression_function_bodies
    - prefer_final_fields
    - prefer_final_in_for_each
    - prefer_final_locals
    - prefer_for_elements_to_map_fromIterable
    - prefer_foreach
    - prefer_function_declarations_over_variables
    - prefer_generic_function_type_aliases
    - prefer_if_elements_to_conditional_expressions
    - prefer_if_null_operators
    - prefer_initializing_formals
    - prefer_inlined_adds
    - prefer_int_literals
    - prefer_interpolation_to_compose_strings
    - prefer_is_empty
    - prefer_is_not_empty
    - prefer_is_not_operator
    - prefer_iterable_whereType
    - prefer_mixin
    - prefer_null_aware_operators
    - prefer_single_quotes
    - prefer_spread_collections
    - prefer_typing_uninitialized_variables
    - prefer_void_to_null
    - provide_deprecation_message
    - public_member_api_docs
    - recursive_getters
    - slash_for_doc_comments
    - sort_child_properties_last
    - sort_constructors_first
    - sort_pub_dependencies
    - sort_unnamed_constructors_first
    - type_annotate_public_apis
    - type_init_formals
    - unawaited_futures
    - unnecessary_await_in_return
    - unnecessary_brace_in_string_interps
    - unnecessary_const
    - unnecessary_getters_setters
    - unnecessary_lambdas
    - unnecessary_new
    - unnecessary_null_aware_assignments
    - unnecessary_null_in_if_null_operators
    - unnecessary_nullable_for_final_variable_declarations
    - unnecessary_overrides
    - unnecessary_parenthesis
    - unnecessary_raw_strings
    - unnecessary_string_escapes
    - unnecessary_string_interpolations
    - unnecessary_this
    - unrelated_type_equality_checks
    - unsafe_html
    - use_build_context_synchronously
    - use_full_hex_values_for_flutter_colors
    - use_function_type_syntax_for_parameters
    - use_if_null_to_convert_nulls_to_bools
    - use_is_even_rather_than_modulo
    - use_key_in_widget_constructors
    - use_late_for_private_fields_and_variables
    - use_named_constants
    - use_raw_strings
    - use_rethrow_when_possible
    - use_setters_to_change_properties
    - use_string_buffers
    - use_to_and_as_if_applicable
    - valid_regexps
    - void_checks
```

### Testing Standards

```dart
// test/standards/testing_standards.dart
abstract class TestingStandards {
  // All tests must follow AAA pattern
  static const testPattern = '''
    test('should [expected behavior] when [condition]', () async {
      // Arrange
      final input = TestData.create();
      when(() => mock.method()).thenReturn(expected);

      // Act
      final result = await sut.execute(input);

      // Assert
      expect(result, equals(expected));
      verify(() => mock.method()).called(1);
    });
  ''';

  // Test naming conventions
  static const namingConventions = {
    'unit_test': '[ClassName]_test.dart',
    'widget_test': '[WidgetName]_widget_test.dart',
    'integration_test': '[Feature]_integration_test.dart',
    'golden_test': '[ScreenName]_golden_test.dart',
  };

  // Coverage requirements
  static const coverageRequirements = {
    'domain': 100,  // Business logic must be fully tested
    'data': 90,     // Data layer with high coverage
    'presentation': 80, // UI with good coverage
    'minimum': 70,  // Absolute minimum for any file
  };
}
```

### Documentation Standards

````dart
/// Feature: Voucher Redemption
///
/// This class handles the redemption of vouchers through QR code scanning.
/// It implements offline-first architecture with automatic synchronization.
///
/// Example:
/// ```dart
/// final result = await redeemVoucher(
///   QRCodeData(code: 'voucher_123'),
/// );
/// ```
///
/// See also:
/// * [VoucherValidator] for validation logic
/// * [QRScanner] for QR code scanning
class RedeemVoucherUseCase {
  /// Redeems a voucher using the provided QR code data.
  ///
  /// Returns [Right<Voucher>] on success, [Left<RedemptionFailure>] on failure.
  ///
  /// Throws:
  /// * [NetworkException] if offline and voucher not cached
  /// * [InvalidQRException] if QR code format is invalid
  Future<Either<RedemptionFailure, Voucher>> call(QRCodeData qrCode) async {
    // Implementation
  }
}
````

---

## Success Metrics

### Technical Metrics

```yaml
security:
  - zero_hardcoded_secrets: true
  - certificate_pinning_enabled: true
  - secure_storage_usage: 100%
  - vulnerability_scan_passed: true

quality:
  - test_coverage: '>= 80%'
  - code_duplication: '< 3%'
  - cyclomatic_complexity: '< 10'
  - technical_debt_ratio: '< 5%'

performance:
  - app_launch_time: '< 2s'
  - screen_transition: '< 300ms'
  - list_scroll_fps: '>= 60'
  - memory_usage: '< 150MB'

reliability:
  - crash_free_rate: '> 99.5%'
  - api_success_rate: '> 99%'
  - offline_capability: '100% core features'
```

### Business Metrics

```yaml
user_experience:
  - onboarding_completion: '> 80%'
  - daily_active_users: '> 60%'
  - feature_adoption: '> 70%'
  - user_satisfaction: '> 4.5/5'

business_impact:
  - voucher_redemption_rate: '> 40%'
  - business_owner_engagement: '> 50%'
  - customer_retention: '> 70%'
  - platform_growth: '> 20% MoM'
```

---

## Conclusion

This architectural reorganization plan provides a **robust, scalable foundation** for VoucherBook that:

1. **Eliminates all critical security vulnerabilities** through proper configuration management
2. **Implements comprehensive testing** with 80%+ coverage target
3. **Supports multi-role users** with clean role-based architecture
4. **Follows industry best practices** with Clean Architecture and DDD
5. **Enables rapid feature development** through modular design
6. **Ensures production readiness** with proper monitoring and error handling

The 6-week implementation roadmap provides clear, actionable steps to transform the current codebase into a **production-grade, enterprise-ready Flutter application** that can scale to support thousands of businesses and millions of customers.

---

**Document Version**: 2.0.0  
**Last Updated**: August 24, 2025  
**Next Review**: Post-Phase 1 Implementation  
**Status**: APPROVED FOR IMPLEMENTATION
