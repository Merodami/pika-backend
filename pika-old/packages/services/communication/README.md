# Communication Service

A unified service that consolidates messaging and notification functionality for the Pika platform.

## Overview

The Communication Service combines the functionality of the previous `notification` and `messaging` services into a single, cohesive service that provides:

- **Real-time messaging** between customers and providers
- **Unified notifications** for all platform events
- **Smart notification batching** to prevent spam
- **Push notification queue** management
- **Conversation management** (archive, block, mute)
- **Message status tracking** (sent, delivered, read)

## Architecture

This service follows the DDD + CQRS pattern with:

- **Read Side**: Optimized for queries (conversations, messages, notifications)
- **Write Side**: Handles commands and business logic
- **Firebase Integration**: Uses Firestore for real-time capabilities
- **Notification Orchestrator**: Unified notification handling

## Key Features

### Messaging

- Real-time 1-on-1 conversations
- Message types: TEXT, IMAGE, FILE, SYSTEM
- Message editing and soft deletion
- Reply-to functionality
- Read receipts and delivery status
- Conversation archiving, blocking, muting

### Notifications

- 11+ notification types (voucher, payment, review, etc.)
- Multilingual support (es, en, gn, pt)
- Entity references for deep linking
- Expiration management
- Smart batching to prevent spam

### Enhanced Features

- **NotificationOrchestrator**: Automatically creates notifications when messages are sent
- **NotificationBatcher**: Groups multiple messages into single push notifications
- **Push Queue**: Firebase-based queue for reliable push notification delivery
- **Real-time Updates**: Live conversation and notification updates

## API Endpoints

### Conversations

```
GET    /conversations                    # List user conversations
POST   /conversations                    # Create new conversation
GET    /conversations/{id}               # Get conversation details
PATCH  /conversations/{id}               # Update (archive, mute, block)
```

### Messages

```
GET    /conversations/{id}/messages      # Get messages (paginated)
POST   /conversations/{id}/messages      # Send new message
PATCH  /conversations/{id}/messages/{msgId} # Edit message
DELETE /conversations/{id}/messages/{msgId} # Delete message
POST   /conversations/{id}/messages/read # Mark messages as read
```

### Notifications

```
GET    /notifications                    # List notifications
GET    /notifications/unread-count       # Get unread counts
PATCH  /notifications/{id}/read          # Mark as read
POST   /notifications/read-all           # Mark all as read
DELETE /notifications/{id}               # Delete notification
```

## Development

### Prerequisites

- Node.js 22.x
- Firebase Admin SDK
- PostgreSQL (for user data)
- Redis (for caching)

### Setup

```bash
# Install dependencies
yarn install

# Start in development mode
yarn nx run @pika/communication:local

# Run tests
yarn nx run @pika/communication:test

# Build
yarn nx run @pika/communication:build
```

### Environment Variables

```bash
COMMUNICATION_SERVER_PORT=5032
FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

## Firebase Schema

```yaml
communication:
  conversations:
    { conversationId }:
      participants: { [userId]: ParticipantInfo }
      lastMessage: MessageSummary
      context: ConversationContext

  messages:
    { conversationId }:
      { messageId }: MessageData

  notifications:
    { userId }:
      items:
        { notificationId }: NotificationData

  push_queue:
    { queueId }: PushNotificationPayload

  user_communication_stats:
    { userId }:
      unreadMessages: number
      unreadNotifications: number
```

## Migration from Legacy Services

This service replaces:

- `@pika/messaging` (port 5024)
- `@pika/notification` (port 5023)

Data migration tools and backward compatibility layers are provided during the transition period.

## Performance Features

- **Real-time subscriptions** using Firebase listeners
- **Smart caching** with Redis integration
- **Batch operations** for bulk updates
- **Connection pooling** for Firebase
- **Notification batching** to reduce push spam

## Security

- **Authentication** via JWT tokens
- **Authorization** per conversation participant
- **Input validation** with TypeBox schemas
- **Rate limiting** on message sending
- **Content filtering** (future enhancement)

## Monitoring

- Health check endpoint: `GET /health`
- Metrics endpoint: `GET /metrics`
- Structured logging with correlation IDs
- Performance monitoring via APM tools

## Future Enhancements

- Group conversations (3+ participants)
- Voice/video calling
- End-to-end encryption
- Message search and indexing
- Advanced notification preferences
- Chatbot integration
