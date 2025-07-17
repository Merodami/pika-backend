# Firebase Integration Guide for Pika Flutter App

This guide provides detailed instructions for integrating Firebase services with the Pika Flutter application.

## 🔥 Firebase Services Used

1. **Firebase Authentication**: Custom token authentication
2. **Cloud Firestore**: Real-time chat database
3. **Firebase Cloud Messaging**: Push notifications
4. **Firebase Storage**: File uploads (future)

## 🔐 Authentication Integration

### Overview

The app uses a hybrid authentication approach:

- **Primary Auth**: JWT tokens from Pika backend
- **Firebase Auth**: Custom tokens for Firebase services

### Implementation Flow

```dart
// 1. User logs in with email/password
final authService = ref.read(authServiceProvider);
await authService.login(email, password);
// Returns: JWT token + User data

// 2. Exchange JWT for Firebase custom token
final firebaseToken = await authService.getFirebaseToken(jwtToken);
// Backend endpoint: POST /auth/firebase-token

// 3. Sign in to Firebase
await FirebaseAuth.instance.signInWithCustomToken(firebaseToken);
```

### Backend Integration Required

Your backend needs to implement the `/auth/firebase-token` endpoint:

```typescript
// Expected request
POST /api/v1/auth/firebase-token
Headers: {
  Authorization: "Bearer {JWT_TOKEN}"
}
Body: {
  purpose: "real-time", // or "messaging", "notifications"
  expiresIn: 3600 // optional, in seconds
}

// Expected response
{
  customToken: "firebase_custom_token_here",
  expiresAt: "2024-01-01T00:00:00Z",
  claims: {
    userId: "user_id",
    role: "customer", // or "provider", "admin"
    purpose: "real-time"
  }
}
```

## 💬 Chat Implementation

### Firestore Structure

```
firestore/
├── conversations/
│   └── {conversationId}/
│       ├── participants: {
│       │     "{userId1}": {
│       │         userId: string,
│       │         name: string,
│       │         avatar: string,
│       │         role: string,
│       │         joinedAt: timestamp
│       │     },
│       │     "{userId2}": { ... }
│       │   }
│       ├── metadata: {
│       │     serviceId: string,
│       │     voucherId: string,
│       │     type: "support" | "service" | "general"
│       │   }
│       ├── lastMessage: {
│       │     content: string,
│       │     senderId: string,
│       │     sentAt: timestamp,
│       │     type: "text" | "image" | "file"
│       │   }
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── messages/
    └── {conversationId}/
        └── messages/
            └── {messageId}/
                ├── content: string
                ├── senderId: string
                ├── type: "text" | "image" | "file" | "location"
                ├── sentAt: timestamp
                ├── readBy: {
                │     "{userId}": timestamp
                │   }
                ├── metadata: {
                │     fileUrl?: string,
                │     fileName?: string,
                │     fileSize?: number,
                │     location?: GeoPoint,
                │     replyTo?: string
                │   }
                └── status: "sent" | "delivered" | "read"
```

### Chat Service Implementation

```dart
// lib/features/chat/data/datasources/firebase_chat_datasource.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FirebaseChatDatasource {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Create or get conversation
  Future<String> createConversation({
    required String otherUserId,
    required Map<String, dynamic> metadata,
  }) async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) throw Exception('User not authenticated');

    // Check if conversation exists
    final existingConv = await _firestore
        .collection('conversations')
        .where('participants.${currentUser.uid}.userId', isEqualTo: currentUser.uid)
        .where('participants.$otherUserId.userId', isEqualTo: otherUserId)
        .limit(1)
        .get();

    if (existingConv.docs.isNotEmpty) {
      return existingConv.docs.first.id;
    }

    // Create new conversation
    final conversationRef = _firestore.collection('conversations').doc();

    await conversationRef.set({
      'participants': {
        currentUser.uid: {
          'userId': currentUser.uid,
          'name': currentUser.displayName ?? 'User',
          'avatar': currentUser.photoURL,
          'role': 'customer', // Get from user data
          'joinedAt': FieldValue.serverTimestamp(),
        },
        otherUserId: {
          'userId': otherUserId,
          // Fetch other user data from your backend
          'joinedAt': FieldValue.serverTimestamp(),
        },
      },
      'metadata': metadata,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    return conversationRef.id;
  }

  // Send message
  Future<void> sendMessage({
    required String conversationId,
    required String content,
    required String type,
    Map<String, dynamic>? metadata,
  }) async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) throw Exception('User not authenticated');

    final messageRef = _firestore
        .collection('messages')
        .doc(conversationId)
        .collection('messages')
        .doc();

    final message = {
      'content': content,
      'senderId': currentUser.uid,
      'type': type,
      'sentAt': FieldValue.serverTimestamp(),
      'readBy': {
        currentUser.uid: FieldValue.serverTimestamp(),
      },
      'metadata': metadata ?? {},
      'status': 'sent',
    };

    // Use batch to update both message and conversation
    final batch = _firestore.batch();

    // Add message
    batch.set(messageRef, message);

    // Update conversation
    batch.update(
      _firestore.collection('conversations').doc(conversationId),
      {
        'lastMessage': {
          'content': content,
          'senderId': currentUser.uid,
          'sentAt': FieldValue.serverTimestamp(),
          'type': type,
        },
        'updatedAt': FieldValue.serverTimestamp(),
      },
    );

    await batch.commit();
  }

  // Get conversations stream
  Stream<List<ConversationModel>> getConversations() {
    final currentUser = _auth.currentUser;
    if (currentUser == null) throw Exception('User not authenticated');

    return _firestore
        .collection('conversations')
        .where('participants.${currentUser.uid}.userId', isEqualTo: currentUser.uid)
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ConversationModel.fromFirestore(doc))
            .toList());
  }

  // Get messages stream
  Stream<List<MessageModel>> getMessages(String conversationId) {
    return _firestore
        .collection('messages')
        .doc(conversationId)
        .collection('messages')
        .orderBy('sentAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => MessageModel.fromFirestore(doc))
            .toList());
  }

  // Mark message as read
  Future<void> markAsRead(String conversationId, String messageId) async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) return;

    await _firestore
        .collection('messages')
        .doc(conversationId)
        .collection('messages')
        .doc(messageId)
        .update({
      'readBy.${currentUser.uid}': FieldValue.serverTimestamp(),
      'status': 'read',
    });
  }
}
```

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isParticipant(conversationId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/conversations/$(conversationId)) &&
        get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants[request.auth.uid] != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Conversations
    match /conversations/{conversationId} {
      allow read: if isParticipant(conversationId);
      allow create: if isAuthenticated() &&
        request.resource.data.participants[request.auth.uid] != null;
      allow update: if isParticipant(conversationId) &&
        request.resource.data.participants == resource.data.participants;
    }

    // Messages
    match /messages/{conversationId}/messages/{messageId} {
      allow read: if isParticipant(conversationId);
      allow create: if isParticipant(conversationId) &&
        request.resource.data.senderId == request.auth.uid;
      allow update: if isParticipant(conversationId) &&
        // Only allow updating readBy and status
        request.resource.data.content == resource.data.content &&
        request.resource.data.senderId == resource.data.senderId;
    }

    // User presence (online status)
    match /presence/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // User FCM tokens
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) &&
        // Only allow updating fcmTokens field
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fcmTokens']);
    }
  }
}
```

## 🔔 Push Notifications Setup

### 1. FCM Token Management

```dart
// lib/features/notifications/data/repositories/fcm_token_repository.dart

class FCMTokenRepository {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<void> saveFCMToken() async {
    final user = _auth.currentUser;
    if (user == null) return;

    final token = await _messaging.getToken();
    if (token == null) return;

    // Save to Firestore
    await _firestore.collection('users').doc(user.uid).set({
      'fcmTokens': FieldValue.arrayUnion([token]),
      'lastUpdated': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    // Also save to backend via API
    await _sendTokenToBackend(token);
  }

  Future<void> _sendTokenToBackend(String token) async {
    // Call your backend API to save FCM token
    final dio = Dio();
    await dio.post(
      '${AppConfig.apiBaseUrl}/users/fcm-token',
      data: {'token': token},
      options: Options(
        headers: {
          'Authorization': 'Bearer ${await _getJwtToken()}',
        },
      ),
    );
  }

  void listenToTokenRefresh() {
    _messaging.onTokenRefresh.listen((newToken) {
      saveFCMToken();
    });
  }
}
```

### 2. Message Handling

```dart
// lib/features/notifications/data/services/notification_handler.dart

class NotificationHandler {
  static Future<void> handleBackgroundMessage(RemoteMessage message) async {
    print('Background message: ${message.messageId}');
    // Handle background messages
  }

  static void handleForegroundMessage(RemoteMessage message) {
    // Show local notification
    final notification = message.notification;
    if (notification != null) {
      LocalNotificationService.showNotification(
        title: notification.title ?? '',
        body: notification.body ?? '',
        payload: message.data,
      );
    }

    // Update app state
    _updateNotificationBadge(message.data);
  }

  static void handleNotificationTap(RemoteMessage message) {
    final type = message.data['type'];

    switch (type) {
      case 'MESSAGE_RECEIVED':
        _navigateToChat(message.data['conversationId']);
        break;
      case 'SERVICE_BOOKED':
        _navigateToVoucher(message.data['voucherId']);
        break;
      case 'BOOKING_UPDATE':
        _navigateToVoucherDetails(message.data['voucherId']);
        break;
      default:
        _navigateToNotifications();
    }
  }
}
```

### 3. Backend Integration for Notifications

Your backend should send notifications in this format:

```json
{
  "to": "FCM_TOKEN_HERE",
  "notification": {
    "title": "New Message",
    "body": "You have a new message from John",
    "badge": 1
  },
  "data": {
    "type": "MESSAGE_RECEIVED",
    "conversationId": "conv123",
    "senderId": "user456",
    "senderName": "John Doe",
    "notificationId": "notif789"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "messages"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

## 🔄 Real-time Sync Strategy

### Online/Offline Status

```dart
// lib/features/chat/data/services/presence_service.dart

class PresenceService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseDatabase _database = FirebaseDatabase.instance;

  void setupPresence() {
    final user = _auth.currentUser;
    if (user == null) return;

    final userStatusRef = _database.ref('status/${user.uid}');
    final isOfflineForDatabase = {
      'state': 'offline',
      'lastSeen': ServerValue.timestamp,
    };

    final isOnlineForDatabase = {
      'state': 'online',
      'lastSeen': ServerValue.timestamp,
    };

    _database.ref('.info/connected').onValue.listen((event) {
      if (event.snapshot.value == false) return;

      userStatusRef.onDisconnect().set(isOfflineForDatabase).then((_) {
        userStatusRef.set(isOnlineForDatabase);
      });
    });

    // Also update Firestore
    final userDocRef = _firestore.collection('presence').doc(user.uid);
    userDocRef.set({
      'online': true,
      'lastSeen': FieldValue.serverTimestamp(),
    });
  }
}
```

### Optimistic Updates

```dart
// Example of optimistic update for sending message
Future<void> sendMessageOptimistic({
  required String conversationId,
  required String content,
}) async {
  // 1. Create temporary message with local ID
  final tempMessage = MessageModel(
    id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
    content: content,
    senderId: currentUser.id,
    sentAt: DateTime.now(),
    status: MessageStatus.sending,
  );

  // 2. Add to local state immediately
  _addMessageToState(tempMessage);

  try {
    // 3. Send to Firebase
    final docRef = await _firestore
        .collection('messages')
        .doc(conversationId)
        .collection('messages')
        .add(tempMessage.toFirestore());

    // 4. Update with real ID
    _updateMessageInState(tempMessage.id, docRef.id);
  } catch (e) {
    // 5. Mark as failed
    _markMessageAsFailed(tempMessage.id);
  }
}
```

## 🚀 Performance Optimization

### 1. Pagination for Messages

```dart
class PaginatedMessagesService {
  static const int _pageSize = 20;
  DocumentSnapshot? _lastDocument;

  Future<List<MessageModel>> loadMessages(
    String conversationId, {
    bool refresh = false,
  }) async {
    if (refresh) _lastDocument = null;

    Query query = _firestore
        .collection('messages')
        .doc(conversationId)
        .collection('messages')
        .orderBy('sentAt', descending: true)
        .limit(_pageSize);

    if (_lastDocument != null) {
      query = query.startAfterDocument(_lastDocument!);
    }

    final snapshot = await query.get();
    if (snapshot.docs.isNotEmpty) {
      _lastDocument = snapshot.docs.last;
    }

    return snapshot.docs
        .map((doc) => MessageModel.fromFirestore(doc))
        .toList();
  }
}
```

### 2. Firestore Offline Persistence

```dart
// Enable offline persistence in main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();

  // Enable offline persistence
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );

  runApp(MyApp());
}
```

## 📊 Analytics Integration

```dart
// Track chat events
class ChatAnalytics {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  static Future<void> logMessageSent({
    required String conversationId,
    required String messageType,
  }) async {
    await _analytics.logEvent(
      name: 'message_sent',
      parameters: {
        'conversation_id': conversationId,
        'message_type': messageType,
        'timestamp': DateTime.now().toIso8601String(),
      },
    );
  }

  static Future<void> logConversationOpened({
    required String conversationId,
  }) async {
    await _analytics.logEvent(
      name: 'conversation_opened',
      parameters: {
        'conversation_id': conversationId,
      },
    );
  }
}
```

## 🧪 Testing Firebase Integration

### 1. Emulator Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

### 2. Connect to Emulators in Flutter

```dart
// main.dart
if (kDebugMode) {
  // Use emulators in debug mode
  await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
  FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
  await FirebaseStorage.instance.useStorageEmulator('localhost', 9199);
}
```

### 3. Test Data Seeding

```dart
// test/fixtures/firebase_test_data.dart
class FirebaseTestData {
  static Future<void> seedTestConversations() async {
    final firestore = FirebaseFirestore.instance;

    // Create test conversation
    await firestore.collection('conversations').doc('test_conv_1').set({
      'participants': {
        'user1': {
          'userId': 'user1',
          'name': 'Test User 1',
          'role': 'customer',
        },
        'user2': {
          'userId': 'user2',
          'name': 'Test User 2',
          'role': 'provider',
        },
      },
      'createdAt': Timestamp.now(),
      'updatedAt': Timestamp.now(),
    });

    // Add test messages
    final batch = firestore.batch();
    for (int i = 0; i < 10; i++) {
      final messageRef = firestore
          .collection('messages')
          .doc('test_conv_1')
          .collection('messages')
          .doc();

      batch.set(messageRef, {
        'content': 'Test message $i',
        'senderId': i % 2 == 0 ? 'user1' : 'user2',
        'type': 'text',
        'sentAt': Timestamp.now(),
      });
    }

    await batch.commit();
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Errors**

   - Ensure JWT token is valid
   - Check Firebase custom token generation
   - Verify Firebase project configuration

2. **Real-time Updates Not Working**

   - Check Firestore security rules
   - Verify user is authenticated
   - Check network connectivity

3. **Push Notifications Not Received**

   - Verify FCM token is saved
   - Check notification permissions
   - Test with Firebase Console

4. **Performance Issues**
   - Implement pagination
   - Use Firebase indexes
   - Enable offline persistence

### Debug Tools

```dart
// Enable Firebase debug logging
FirebaseFirestore.instance.settings = const Settings(
  persistenceEnabled: true,
  host: 'localhost:8080', // For emulator
  sslEnabled: false,
);

// Log all Firestore operations
FirebaseFirestore.instance.snapshotsInSync().listen((_) {
  print('Firestore synced');
});
```

## 🎯 Best Practices

1. **Always validate data** before sending to Firestore
2. **Use batch operations** for multiple writes
3. **Implement proper error handling** for all Firebase operations
4. **Cache user data** to reduce Firestore reads
5. **Use security rules** to protect data
6. **Monitor usage** in Firebase Console
7. **Implement offline support** for better UX
8. **Use transactions** for atomic updates

## 📚 Additional Resources

- [FlutterFire Documentation](https://firebase.flutter.dev/docs/overview)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [FCM Implementation Guide](https://firebase.google.com/docs/cloud-messaging/flutter/client)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
