# Pika Flutter App

A modern, state-of-the-art Flutter application for the Pika marketplace platform, supporting customers and service providers across Android, iOS, and Web platforms.

## 🚀 Features

- **Cross-Platform**: Android, iOS, and Web support
- **Modern Architecture**: Clean Architecture with DDD principles
- **State Management**: Riverpod 2.4+ for reactive state management
- **Firebase Integration**: Real-time chat, push notifications with badges
- **Offline Support**: Hive for local storage and offline capabilities
- **Authentication**: JWT + Firebase hybrid authentication
- **Internationalization**: Support for Spanish (es), English (en), and Guarani (gn)
- **Material 3**: Latest Material Design with dynamic theming
- **Type Safety**: Full Dart 3+ null safety with Freezed models

## 📱 Technology Stack

### Core Dependencies

- **Flutter**: 3.32.1+ (Latest stable)
- **Dart**: 3.2+
- **State Management**: flutter_riverpod (2.4.10)
- **Navigation**: go_router (15.1.2)
- **Networking**: dio (5.7.0) + retrofit (4.4.1)
- **Local Storage**: hive (2.2.3) + flutter_secure_storage (10.0.0-beta.4)

### Firebase Services

- **firebase_core**: 3.6.0
- **firebase_auth**: 5.3.1
- **firebase_messaging**: 15.1.3
- **cloud_firestore**: 5.4.3
- **firebase_storage**: 12.3.2

### UI/UX

- **Animations**: flutter_animate (4.5.0)
- **Images**: cached_network_image (3.4.1)
- **Notifications**: flutter_local_notifications (19.2.1)
- **Badges**: badges (3.1.2)

## 🏗️ Architecture

```
lib/
├── core/                      # Core functionality
│   ├── config/               # App configuration
│   ├── constants/            # App constants
│   ├── exceptions/           # Custom exceptions
│   ├── localization/         # i18n support
│   ├── models/               # Core models
│   ├── providers/            # Global providers
│   ├── routing/              # App routing
│   ├── services/             # Core services
│   │   ├── api/             # API client
│   │   ├── auth/            # Authentication
│   │   ├── firebase/        # Firebase services
│   │   ├── notification/    # Push notifications
│   │   └── storage/         # Local storage
│   ├── theme/                # App theming
│   └── utils/                # Utilities
├── features/                  # Feature modules
│   ├── auth/                 # Authentication feature
│   ├── categories/           # Categories feature
│   ├── chat/                 # Chat feature
│   ├── home/                 # Home feature
│   ├── notifications/        # Notifications feature
│   ├── profile/              # Profile feature
│   └── services/             # Services feature
├── shared/                    # Shared components
│   ├── providers/            # Shared providers
│   ├── utils/                # Shared utilities
│   └── widgets/              # Shared widgets
└── main.dart                  # App entry point
```

## 🔧 Setup Instructions

### Prerequisites

1. **Flutter SDK**: 3.32.1 or higher

   ```bash
   flutter --version
   ```

2. **Dart SDK**: 3.2 or higher

3. **Development Tools**:
   - Android Studio / Xcode
   - VS Code with Flutter extension
   - Git

### Installation

1. **Clone the repository**:

   ```bash
   cd packages/frontend/flutter-app
   ```

2. **Install dependencies**:

   ```bash
   flutter pub get
   ```

3. **Generate code**:

   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Setup Firebase**:

   ```bash
   # Install FlutterFire CLI
   dart pub global activate flutterfire_cli

   # Configure Firebase
   flutterfire configure
   ```

5. **Platform-specific setup**:

   **Android**:
   - Add `google-services.json` to `android/app/`
   - Minimum SDK: 21
   - Target SDK: 34

   **iOS**:
   - Add `GoogleService-Info.plist` to `ios/Runner/`
   - Minimum iOS version: 12.0
   - Enable Push Notifications capability

   **Web**:
   - Firebase config is already in `firebase_options.dart`

### Environment Configuration

Create `.env` file in the root directory:

```env
API_BASE_URL=http://localhost:8000/api/v1
FIREBASE_PROJECT_ID=pika-demo
```

### Running the App

```bash
# Run on iOS
flutter run -d ios

# Run on Android
flutter run -d android

# Run on Web
flutter run -d chrome

# Run with specific environment
flutter run --dart-define=API_BASE_URL=https://api.pika.com/api/v1
```

## 🔐 Authentication Flow

The app uses a hybrid authentication approach:

1. **Primary Authentication**: JWT tokens from your backend
2. **Firebase Authentication**: Custom tokens for real-time features

```dart
// Login flow
1. User enters credentials
2. App authenticates with backend API
3. Backend returns JWT token + user data
4. App exchanges JWT for Firebase custom token
5. App signs into Firebase with custom token
6. User can access all features
```

## 💬 Firebase Chat Integration

### Setup

1. **Firestore Structure**:

   ```
   conversations/
   ├── {conversationId}/
   │   ├── participants: Map<userId, ParticipantInfo>
   │   ├── lastMessage: MessageInfo
   │   ├── createdAt: Timestamp
   │   └── updatedAt: Timestamp

   messages/
   ├── {conversationId}/
   │   └── messages/
   │       └── {messageId}/
   │           ├── content: String
   │           ├── senderId: String
   │           ├── type: String
   │           ├── sentAt: Timestamp
   │           └── metadata: Map
   ```

2. **Security Rules**: See `firestore.rules`

### Usage Example

```dart
// Send a message
final chatService = ref.read(chatServiceProvider);
await chatService.sendMessage(
  conversationId: 'conv123',
  content: 'Hello!',
  type: MessageType.text,
);

// Listen to messages
final messages = ref.watch(messagesStreamProvider('conv123'));
```

## 🔔 Push Notifications

### Features

- Background message handling
- Local notifications with badges
- Deep linking support
- Topic subscriptions

### Setup

1. Enable Firebase Cloud Messaging
2. Configure notification channels
3. Request permissions on app start

### Testing

```bash
# Send test notification
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_TOKEN",
    "notification": {
      "title": "Test",
      "body": "Test message"
    },
    "data": {
      "type": "MESSAGE_RECEIVED",
      "conversationId": "123"
    }
  }'
```

## 🌐 Offline Support

The app provides comprehensive offline support:

1. **Cached API Responses**: Automatic caching with Dio
2. **Local Storage**: Hive for persistent data
3. **Offline Queue**: Pending actions sync when online
4. **Optimistic Updates**: Immediate UI updates

## 🧪 Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Run integration tests
flutter test integration_test
```

## 📦 Building for Production

### Android

```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS

```bash
flutter build ios --release
# Then archive in Xcode
```

### Web

```bash
flutter build web --release
```

## 🎨 Theming

The app supports Material 3 theming with:

- Light/Dark mode
- System theme following
- Custom color schemes
- Responsive typography

## 🌍 Localization

Add new translations:

1. Update `lib/core/localization/app_localizations_*.dart`
2. Add new language file if needed
3. Update `supportedLocales` in `app_localizations.dart`

## 🚀 Performance Optimization

- **Code Splitting**: Deferred loading for features
- **Image Optimization**: WebP format, lazy loading
- **Tree Shaking**: Minimal bundle size
- **Caching Strategy**: Smart cache invalidation

## 📱 Responsive Design

The app is fully responsive:

- Adaptive layouts for different screen sizes
- Tablet-optimized UI
- Foldable device support
- Landscape orientation handling

## 🔒 Security

- **Secure Storage**: Sensitive data encrypted
- **Certificate Pinning**: For API calls (optional)
- **Obfuscation**: Code obfuscation for release builds
- **Input Validation**: Client-side validation

## 🐛 Debugging

```bash
# Enable detailed logs
flutter run --verbose

# Flutter Inspector
flutter run --track-widget-creation

# Performance profiling
flutter run --profile
```

## 📚 Additional Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Riverpod Documentation](https://riverpod.dev/)
- [Firebase Flutter Setup](https://firebase.google.com/docs/flutter/setup)
- [Material 3 Design](https://m3.material.io/)

## 🤝 Contributing

1. Follow the existing architecture patterns
2. Write tests for new features
3. Update documentation
4. Use conventional commits

## 📄 License

This project is proprietary and confidential.
