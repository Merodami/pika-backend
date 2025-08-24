# Flutter App Extension Guide

## 📚 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Adding New Features](#adding-new-features)
- [Creating Components](#creating-components)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Architecture Overview

The app follows **Clean Architecture** with clear separation of concerns:

```
lib/
├── core/                 # Core functionality
├── features/            # Feature modules
├── shared/              # Shared components
└── main.dart           # App entry point
```

### Layer Responsibilities

| Layer            | Purpose                     | Dependencies |
| ---------------- | --------------------------- | ------------ |
| **Domain**       | Business logic & entities   | None         |
| **Data**         | API/Database implementation | Domain       |
| **Presentation** | UI & State management       | Domain       |

## Adding New Features

### 🚀 Quick Feature Template

To add a new feature (e.g., "Products"), follow this structure:

```bash
lib/features/products/
├── domain/
│   ├── entities/
│   │   └── product.dart
│   ├── repositories/
│   │   └── product_repository.dart
│   └── usecases/
│       ├── get_products.dart
│       └── search_products.dart
├── data/
│   ├── models/
│   │   └── product_model.dart
│   ├── datasources/
│   │   ├── product_remote_datasource.dart
│   │   └── product_local_datasource.dart
│   └── repositories/
│       └── product_repository_impl.dart
└── presentation/
    ├── providers/
    │   └── product_providers.dart
    ├── pages/
    │   └── products_page.dart
    └── widgets/
        └── product_card.dart
```

### Step-by-Step Implementation

#### 1️⃣ Create Domain Entity

```dart
// lib/features/products/domain/entities/product.dart
import 'package:equatable/equatable.dart';

class Product extends Equatable {
  final String id;
  final String name;
  final double price;
  final String? imageUrl;
  final bool isAvailable;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    this.imageUrl,
    required this.isAvailable,
  });

  @override
  List<Object?> get props => [id, name, price, imageUrl, isAvailable];
}
```

#### 2️⃣ Define Repository Interface

```dart
// lib/features/products/domain/repositories/product_repository.dart
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/product.dart';

abstract class ProductRepository {
  Future<Either<Failure, List<Product>>> getProducts({
    int? page,
    int? limit,
  });

  Future<Either<Failure, Product>> getProductById(String id);

  Future<Either<Failure, List<Product>>> searchProducts(String query);
}
```

#### 3️⃣ Create Use Case

```dart
// lib/features/products/domain/usecases/get_products.dart
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/product.dart';
import '../repositories/product_repository.dart';

class GetProducts extends UseCase<List<Product>, GetProductsParams> {
  final ProductRepository repository;

  GetProducts(this.repository);

  @override
  Future<Either<Failure, List<Product>>> call(GetProductsParams params) {
    return repository.getProducts(
      page: params.page,
      limit: params.limit,
    );
  }
}

class GetProductsParams extends Params {
  final int? page;
  final int? limit;

  const GetProductsParams({this.page, this.limit});

  @override
  List<Object?> get props => [page, limit];
}
```

#### 4️⃣ Implement Data Model

```dart
// lib/features/products/data/models/product_model.dart
import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/product.dart';

part 'product_model.g.dart';

@JsonSerializable()
class ProductModel {
  final String id;
  final String name;
  final double price;

  @JsonKey(name: 'image_url')
  final String? imageUrl;

  @JsonKey(name: 'is_available')
  final bool isAvailable;

  const ProductModel({
    required this.id,
    required this.name,
    required this.price,
    this.imageUrl,
    required this.isAvailable,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) =>
      _$ProductModelFromJson(json);

  Map<String, dynamic> toJson() => _$ProductModelToJson(this);

  Product toEntity() => Product(
    id: id,
    name: name,
    price: price,
    imageUrl: imageUrl,
    isAvailable: isAvailable,
  );

  factory ProductModel.fromEntity(Product entity) => ProductModel(
    id: entity.id,
    name: entity.name,
    price: entity.price,
    imageUrl: entity.imageUrl,
    isAvailable: entity.isAvailable,
  );
}
```

#### 5️⃣ Set Up Riverpod Providers

```dart
// lib/features/products/presentation/providers/product_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection_container.dart';
import '../../domain/usecases/get_products.dart';

// Use case provider
final getProductsProvider = Provider<GetProducts>((ref) {
  return sl<GetProducts>();
});

// Products state notifier
class ProductsNotifier extends StateNotifier<ProductsState> {
  final GetProducts _getProducts;

  ProductsNotifier(this._getProducts) : super(const ProductsState());

  Future<void> loadProducts() async {
    state = state.copyWith(isLoading: true);

    final result = await _getProducts(
      const GetProductsParams(limit: 20),
    );

    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure,
      ),
      (products) => state = state.copyWith(
        isLoading: false,
        products: products,
      ),
    );
  }
}

// State provider
final productsProvider =
    StateNotifierProvider<ProductsNotifier, ProductsState>((ref) {
  return ProductsNotifier(ref.watch(getProductsProvider));
});
```

#### 6️⃣ Register in Dependency Injection

```dart
// lib/core/di/injection_container.dart

// Add to _initDataSources()
sl.registerLazySingleton<ProductRemoteDataSource>(
  () => ProductRemoteDataSourceImpl(dio: sl(), baseUrl: baseUrl),
);

// Add to _initRepositories()
sl.registerLazySingleton<ProductRepository>(
  () => ProductRepositoryImpl(
    remoteDataSource: sl(),
    localDataSource: sl(),
    networkInfo: sl(),
  ),
);

// Add to _initUseCases()
sl.registerLazySingleton(() => GetProducts(sl()));
```

## Creating Components

### Atomic Design Hierarchy

```
Atoms → Molecules → Organisms → Templates → Pages
```

### Creating an Atom

```dart
// lib/shared/widgets/atoms/app_chip.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AppChip extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool isSelected;

  const AppChip({
    super.key,
    required this.label,
    this.onTap,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: 12.w,
          vertical: 6.h,
        ),
        decoration: BoxDecoration(
          color: isSelected
            ? theme.primaryColor
            : theme.cardColor,
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(
            color: isSelected
              ? theme.primaryColor
              : theme.dividerColor,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.sp,
            color: isSelected
              ? Colors.white
              : theme.textTheme.bodyMedium?.color,
          ),
        ),
      ),
    );
  }
}
```

### Creating a Molecule

```dart
// lib/shared/widgets/molecules/filter_bar.dart
import 'package:flutter/material.dart';
import '../atoms/app_chip.dart';

class FilterBar extends StatelessWidget {
  final List<String> filters;
  final String? selectedFilter;
  final ValueChanged<String> onFilterSelected;

  const FilterBar({
    super.key,
    required this.filters,
    this.selectedFilter,
    required this.onFilterSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((filter) =>
          Padding(
            padding: EdgeInsets.only(right: 8.w),
            child: AppChip(
              label: filter,
              isSelected: filter == selectedFilter,
              onTap: () => onFilterSelected(filter),
            ),
          ),
        ).toList(),
      ),
    );
  }
}
```

## State Management

### Using Riverpod with Hooks

```dart
// lib/features/products/presentation/pages/products_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class ProductsPage extends HookConsumerWidget {
  const ProductsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Use hooks for local state
    final searchController = useTextEditingController();
    final isGridView = useState(false);

    // Watch providers
    final productsState = ref.watch(productsProvider);

    // Use lifecycle hooks
    useEffect(() {
      // Load products on mount
      ref.read(productsProvider.notifier).loadProducts();
      return null;
    }, []);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(
            icon: Icon(isGridView.value ? Icons.list : Icons.grid_view),
            onPressed: () => isGridView.value = !isGridView.value,
          ),
        ],
      ),
      body: productsState.isLoading
          ? const AppLoadingIndicator()
          : isGridView.value
              ? _buildGridView(productsState.products)
              : _buildListView(productsState.products),
    );
  }
}
```

## API Integration

### Adding New API Endpoints

1. **Update Remote Data Source**:

```dart
// lib/features/products/data/datasources/product_remote_datasource.dart
class ProductRemoteDataSourceImpl implements ProductRemoteDataSource {
  final Dio dio;
  final String baseUrl;

  @override
  Future<ProductModel> createProduct(ProductModel product) async {
    try {
      final response = await dio.post(
        '$baseUrl/products',
        data: product.toJson(),
      );

      return ProductModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
}
```

2. **Handle Errors with Either**:

```dart
// lib/features/products/data/repositories/product_repository_impl.dart
@override
Future<Either<Failure, Product>> createProduct(Product product) async {
  if (!await networkInfo.isConnected) {
    return const Left(NetworkFailure());
  }

  try {
    final model = ProductModel.fromEntity(product);
    final result = await remoteDataSource.createProduct(model);
    return Right(result.toEntity());
  } on ValidationException catch (e) {
    return Left(ValidationFailure(message: e.message));
  } catch (e) {
    return Left(UnknownFailure(originalError: e));
  }
}
```

## Testing

### Unit Testing

```dart
// test/features/products/domain/usecases/get_products_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:fpdart/fpdart.dart';

class MockProductRepository extends Mock implements ProductRepository {}

void main() {
  late GetProducts useCase;
  late MockProductRepository mockRepository;

  setUp(() {
    mockRepository = MockProductRepository();
    useCase = GetProducts(mockRepository);
  });

  test('should get products from repository', () async {
    // Arrange
    final products = [
      const Product(id: '1', name: 'Product 1', price: 10.0, isAvailable: true),
    ];
    when(() => mockRepository.getProducts())
        .thenAnswer((_) async => Right(products));

    // Act
    final result = await useCase(const GetProductsParams());

    // Assert
    expect(result, Right(products));
    verify(() => mockRepository.getProducts()).called(1);
  });
}
```

### Widget Testing

```dart
// test/shared/widgets/atoms/app_button_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

void main() {
  testWidgets('AppButton displays text and responds to tap', (tester) async {
    bool wasPressed = false;

    await tester.pumpWidget(
      ScreenUtilInit(
        designSize: const Size(375, 812),
        builder: (context, child) => MaterialApp(
          home: Scaffold(
            body: AppButton(
              text: 'Test Button',
              onPressed: () => wasPressed = true,
            ),
          ),
        ),
      ),
    );

    expect(find.text('Test Button'), findsOneWidget);

    await tester.tap(find.byType(AppButton));
    await tester.pump();

    expect(wasPressed, true);
  });
}
```

## Best Practices

### 1. **Follow Clean Architecture**

- Keep domain layer pure (no Flutter dependencies)
- Use dependency injection for all services
- Return `Either<Failure, Success>` from repositories

### 2. **Component Design**

```dart
// ✅ Good: Reusable, configurable
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final Color? color;
  final VoidCallback? onTap;
}

// ❌ Bad: Too specific, not reusable
class ProductPriceCard extends StatelessWidget {
  final double price;
  final String currency;
}
```

### 3. **State Management**

```dart
// ✅ Good: Immutable state with copyWith
class ProductsState {
  final bool isLoading;
  final List<Product> products;

  ProductsState copyWith({...});
}

// ❌ Bad: Mutable state
class ProductsState {
  bool isLoading = false;
  List<Product> products = [];
}
```

### 4. **Error Handling**

```dart
// ✅ Good: Graceful error handling
result.fold(
  (failure) => showSnackBar(failure.message),
  (data) => navigateToDetails(data),
);

// ❌ Bad: Throwing exceptions in UI
try {
  final data = await getProducts();
} catch (e) {
  print(e); // Don't do this
}
```

### 5. **Responsive Design**

```dart
// ✅ Good: Using ScreenUtil
Container(
  padding: EdgeInsets.all(16.w),
  height: 200.h,
  child: Text('Hello', style: TextStyle(fontSize: 14.sp)),
);

// ❌ Bad: Fixed values
Container(
  padding: EdgeInsets.all(16),
  height: 200,
  child: Text('Hello', style: TextStyle(fontSize: 14)),
);
```

### 6. **Naming Conventions**

| Type          | Convention           | Example             |
| ------------- | -------------------- | ------------------- |
| **Files**     | snake_case           | `product_card.dart` |
| **Classes**   | PascalCase           | `ProductCard`       |
| **Variables** | camelCase            | `productList`       |
| **Constants** | SCREAMING_SNAKE      | `MAX_RETRY_COUNT`   |
| **Private**   | \_leading underscore | `_internalMethod()` |

### 7. **Folder Organization**

```
✅ Good: Feature-based
features/
├── products/
├── cart/
└── checkout/

❌ Bad: Type-based
models/
├── product.dart
├── cart.dart
└── order.dart
```

## Quick Commands

```bash
# Generate code
flutter pub run build_runner build --delete-conflicting-outputs

# Run tests
flutter test

# Run with coverage
flutter test --coverage

# Analyze code
flutter analyze

# Format code
dart format .

# Clean and get packages
flutter clean && flutter pub get
```

## Debugging Tips

### 1. **View Logs**

```dart
// In debug mode, shake device or press 'View Logs' in error screen
logger.openTalkerScreen(context);
```

### 2. **Inspect Network Calls**

```dart
// Talker automatically logs all Dio requests/responses
// Check console or Talker screen
```

### 3. **State Debugging**

```dart
// Add ProviderObserver to track all state changes
ref.listen(productsProvider, (previous, next) {
  logger.info('Products state changed: $next');
});
```

## Performance Optimization

### 1. **Use const Constructors**

```dart
const AppButton(text: 'Submit'); // Compile-time constant
```

### 2. **Lazy Loading**

```dart
final heavyProvider = FutureProvider.autoDispose((ref) async {
  // Only loads when accessed, disposed when not needed
});
```

### 3. **Image Optimization**

```dart
CachedNetworkImage(
  imageUrl: url,
  memCacheHeight: 200, // Limit memory usage
  memCacheWidth: 200,
);
```

## Troubleshooting

| Issue                                | Solution                                                   |
| ------------------------------------ | ---------------------------------------------------------- |
| **Type 'X' is not a subtype of 'Y'** | Run `flutter clean && flutter pub get`                     |
| **Generated files not found**        | Run `flutter pub run build_runner build`                   |
| **Dependency injection fails**       | Ensure service is registered in `injection_container.dart` |
| **State not updating**               | Check if using `.notifier` for mutations                   |
| **Responsive sizing wrong**          | Verify ScreenUtil is initialized in main.dart              |

## Resources

- [Clean Architecture Guide](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Riverpod Documentation](https://riverpod.dev/)
- [Flutter Hooks](https://pub.dev/packages/flutter_hooks)
- [FP Dart (Either Pattern)](https://pub.dev/packages/fpdart)
- [Atomic Design Methodology](https://bradfrost.com/blog/post/atomic-web-design/)
- [Very Good Ventures Standards](https://verygood.ventures/)
