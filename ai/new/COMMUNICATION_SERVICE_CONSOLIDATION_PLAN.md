# Communication Service Consolidation Plan

## Executive Summary

This document outlines the plan to consolidate the current `notification` and `messaging` services into a unified `communication` service. The consolidation aims to reduce complexity, improve performance, and provide a better developer experience while maintaining MVP-level simplicity.

## Current State Analysis

### Notification Service

- **Purpose**: Generic notification system for all platform events
- **Storage**: Firebase Firestore
- **Key Features**:
  - 11 notification types (including MESSAGE_RECEIVED)
  - Entity references for deep linking
  - Read/unread tracking
  - Expiration support
  - No actual push notification delivery (stores records only)

### Messaging Service

- **Purpose**: Real-time chat between customers and providers
- **Storage**: Firebase Firestore
- **Key Features**:
  - Real-time messaging with Firebase listeners
  - Conversation management (archive, block, mute)
  - Message status tracking (sent, delivered, read)
  - Edit history and soft delete
  - Reply-to functionality
  - Dual notification integration (Firebase direct + HTTP)

## Identified Overlaps

1. **MESSAGE_RECEIVED Notification**: Messaging service creates notifications when messages are sent
2. **Dual Firebase Storage**: Both services use Firebase Firestore
3. **User Context Management**: Both track user interactions and states
4. **Real-time Requirements**: Both could benefit from unified real-time listeners
5. **Similar Architecture**: Both follow CQRS with Firebase repositories

## Consolidation Architecture

### Service Name: `@pika/communication`

### Directory Structure

```
packages/services/communication/
├── src/
│   ├── read/
│   │   ├── api/
│   │   │   ├── controllers/
│   │   │   │   ├── MessageController.ts
│   │   │   │   ├── ConversationController.ts
│   │   │   │   └── NotificationController.ts
│   │   │   └── routes/
│   │   │       ├── MessageRouter.ts
│   │   │       ├── ConversationRouter.ts
│   │   │       └── NotificationRouter.ts
│   │   ├── application/
│   │   │   └── use_cases/
│   │   │       ├── messages/
│   │   │       │   ├── GetMessagesQueryHandler.ts
│   │   │       │   └── SearchMessagesQueryHandler.ts
│   │   │       ├── conversations/
│   │   │       │   ├── GetConversationsQueryHandler.ts
│   │   │       │   └── GetConversationByIdQueryHandler.ts
│   │   │       └── notifications/
│   │   │           ├── GetUserNotificationsQueryHandler.ts
│   │   │           └── GetNotificationsByEntityQueryHandler.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── Message.ts
│   │   │   │   ├── Conversation.ts
│   │   │   │   └── Notification.ts
│   │   │   ├── services/
│   │   │   │   ├── NotificationOrchestrator.ts
│   │   │   │   ├── NotificationBatcher.ts
│   │   │   │   └── SubscriptionManager.ts
│   │   │   └── ports/
│   │   │       ├── MessageReadRepositoryPort.ts
│   │   │       ├── ConversationReadRepositoryPort.ts
│   │   │       └── NotificationReadRepositoryPort.ts
│   │   └── infrastructure/
│   │       └── persistence/
│   │           └── firebase/
│   │               ├── repositories/
│   │               └── listeners/
│   └── write/
│       └── [similar structure]
```

## Key Enhancements (MVP Level)

### 1. Unified Notification Orchestrator

```typescript
export class NotificationOrchestrator {
  constructor(
    private notificationRepo: NotificationWriteRepositoryPort,
    private batcher: NotificationBatcher,
    private pushQueue: PushNotificationQueue,
  ) {}

  async handleMessageSent(message: Message, conversation: Conversation): Promise<void> {
    const recipient = conversation.getOtherParticipant(message.senderId)
    const participant = conversation.participants.get(recipient)

    // Create in-app notification
    const notification = await this.notificationRepo.create({
      userId: recipient,
      type: NotificationType.MESSAGE_RECEIVED,
      title: this.getSenderName(message.senderId),
      body: this.truncateMessage(message),
      entityRef: {
        entityType: 'conversation',
        entityId: conversation.id,
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    // Queue push notification if enabled and not muted
    if (!participant.isMuted) {
      await this.batcher.bufferMessage(recipient, message, notification)
    }
  }

  private truncateMessage(message: Message): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content.length > 100 ? message.content.substring(0, 97) + '...' : message.content
      case MessageType.IMAGE:
        return '📷 Image'
      case MessageType.FILE:
        return `📎 ${message.metadata?.fileName || 'File'}`
      default:
        return 'New message'
    }
  }
}
```

### 2. Smart Notification Batching

```typescript
export class NotificationBatcher {
  private messageBuffer = new Map<string, BufferedNotification[]>()
  private flushTimers = new Map<string, NodeJS.Timeout>()

  constructor(
    private pushQueue: PushNotificationQueue,
    private windowMs: number = 30000, // 30 seconds
  ) {}

  async bufferMessage(userId: string, message: Message, notification: Notification): Promise<void> {
    const buffer = this.messageBuffer.get(userId) || []
    buffer.push({ message, notification, timestamp: new Date() })
    this.messageBuffer.set(userId, buffer)

    if (buffer.length === 1) {
      // First message - set timer
      const timer = setTimeout(() => this.flushBuffer(userId), this.windowMs)
      this.flushTimers.set(userId, timer)
    }
  }

  private async flushBuffer(userId: string): Promise<void> {
    const buffer = this.messageBuffer.get(userId) || []
    this.messageBuffer.delete(userId)
    this.flushTimers.delete(userId)

    if (buffer.length === 0) return

    if (buffer.length === 1) {
      // Single notification
      await this.pushQueue.enqueue({
        userId,
        title: buffer[0].notification.title,
        body: buffer[0].notification.body,
        data: {
          notificationId: buffer[0].notification.id,
          conversationId: buffer[0].message.conversationId,
        },
      })
    } else {
      // Grouped notification
      const senderName = buffer[0].notification.title
      await this.pushQueue.enqueue({
        userId,
        title: senderName,
        body: `${buffer.length} new messages`,
        data: {
          conversationId: buffer[0].message.conversationId,
          messageCount: buffer.length,
        },
      })
    }
  }
}
```

### 3. Real-time Subscription Manager

```typescript
export class SubscriptionManager {
  constructor(private firestore: Firestore) {}

  subscribeToUserCommunications(userId: string): UserSubscriptions {
    return {
      conversations: this.subscribeToConversations(userId),
      notifications: this.subscribeToNotifications(userId),
      unreadCounts: this.subscribeToUnreadCounts(userId),
    }
  }

  private subscribeToConversations(userId: string): () => void {
    const query = this.firestore.collection('conversations').where(`participants.${userId}.userId`, '==', userId).orderBy('updatedAt', 'desc')

    return query.onSnapshot((snapshot) => {
      // Handle conversation updates
    })
  }

  private subscribeToNotifications(userId: string): () => void {
    const query = this.firestore.collection('notifications').doc(userId).collection('items').where('read', '==', false).orderBy('createdAt', 'desc').limit(50)

    return query.onSnapshot((snapshot) => {
      // Handle notification updates
    })
  }

  private subscribeToUnreadCounts(userId: string): () => void {
    // Real-time unread counts for both messages and notifications
    return this.firestore
      .collection('user_communication_stats')
      .doc(userId)
      .onSnapshot((doc) => {
        // Handle unread count updates
      })
  }
}
```

### 4. Enhanced Message Features

```typescript
export interface EnhancedMessageMetadata {
  // File attachments
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mimeType?: string

  // Rich previews
  preview?: {
    thumbnailUrl?: string
    dimensions?: { width: number; height: number }
    duration?: number // For videos/audio
  }

  // Link previews
  links?: Array<{
    url: string
    title?: string
    description?: string
    imageUrl?: string
    favicon?: string
  }>

  // Mentions (future enhancement)
  mentions?: string[]
}

export class MessageEnhancer {
  async enhanceMessage(message: Message): Promise<Message> {
    if (message.type === MessageType.TEXT) {
      // Extract and preview links
      const links = this.extractLinks(message.content)
      if (links.length > 0) {
        message.metadata = {
          ...message.metadata,
          links: await this.fetchLinkPreviews(links),
        }
      }
    }

    if (message.type === MessageType.IMAGE) {
      // Generate thumbnail
      message.metadata = {
        ...message.metadata,
        preview: await this.generateImagePreview(message.metadata.fileUrl),
      }
    }

    return message
  }
}
```

### 5. Unified API Structure

```yaml
/communication/
  # Conversations
  /conversations:
    GET    /                              # List user conversations
    POST   /                              # Create new conversation
    GET    /{id}                          # Get conversation details
    PATCH  /{id}                          # Update (archive, mute, block)
    DELETE /{id}                          # Delete conversation (soft)

  # Messages
  /conversations/{id}/messages:
    GET    /                              # Get messages (paginated)
    POST   /                              # Send new message
    GET    /{messageId}                   # Get specific message
    PATCH  /{messageId}                   # Edit message
    DELETE /{messageId}                   # Delete message (soft)

  # Message actions
  /conversations/{id}/messages/read:
    POST   /                              # Mark messages as read

  # Notifications
  /notifications:
    GET    /                              # List notifications
    GET    /unread-count                  # Get unread counts
    PATCH  /{id}/read                     # Mark as read
    POST   /read-all                      # Mark all as read
    DELETE /{id}                          # Delete notification

  # Preferences
  /preferences:
    GET    /                              # Get user preferences
    PATCH  /                              # Update preferences
```

## Firebase Schema

```yaml
# Unified Firebase structure
communication:
  # Conversations with participants
  conversations:
    { conversationId }:
      participants:
        { userId }:
          userId: string
          userType: CUSTOMER | PROVIDER
          joinedAt: timestamp
          lastReadAt: timestamp
          lastReadMessageId: string
          isArchived: boolean
          isBlocked: boolean
          isMuted: boolean
          unreadCount: number
      lastMessage:
        id: string
        content: string
        senderId: string
        sentAt: timestamp
        type: MessageType
      context:
        type: string
        id: string
        metadata: object
      createdAt: timestamp
      updatedAt: timestamp

  # Messages collection
  messages:
    { conversationId }:
      { messageId }:
        senderId: string
        senderType: CUSTOMER | PROVIDER
        type: TEXT | IMAGE | FILE | SYSTEM
        content: string
        metadata: EnhancedMessageMetadata
        status:
          sent: timestamp
          delivered: timestamp
          read: timestamp
        replyTo:
          messageId: string
          content: string
          senderId: string
        editHistory: array
        deletedAt: timestamp
        createdAt: timestamp
        updatedAt: timestamp

  # User notifications
  notifications:
    { userId }:
      items:
        { notificationId }:
          type: NotificationType
          title: MultilingualText
          body: MultilingualText
          icon: string
          entityRef:
            entityType: string
            entityId: string
          read: boolean
          createdAt: timestamp
          expiresAt: timestamp

  # User preferences
  user_preferences:
    { userId }:
      notification:
        channels:
          inApp: boolean
          push: boolean
          email: boolean
        quiet:
          enabled: boolean
          startTime: string
          endTime: string
        messageGrouping:
          enabled: boolean
          windowSeconds: number
      communication:
        autoArchiveAfterDays: number
        showOnlineStatus: boolean

  # Communication stats for quick access
  user_communication_stats:
    { userId }:
      unreadMessages: number
      unreadNotifications: number
      lastActivity: timestamp

  # Push notification queue
  push_queue:
    { queueId }:
      userId: string
      title: string
      body: string
      data: object
      priority: HIGH | NORMAL | LOW
      scheduledFor: timestamp
      attempts: number
      lastAttempt: timestamp
      status: PENDING | SENT | FAILED

  # Metrics collection
  metrics:
    daily:
      { date }:
        messages:
          sent: number
          delivered: number
          read: number
        notifications:
          created: number
          delivered: number
          opened: number
        conversations:
          started: number
          active: number
```

## Migration Plan

### Phase 1: Setup & Structure (Week 1)

1. **Create Communication Service**
   - Initialize new service structure
   - Setup package.json and dependencies
   - Configure Firebase connection
   - Create base domain entities

2. **Merge Domain Models**
   - Combine Message and Notification entities
   - Create unified repository interfaces
   - Implement shared value objects
   - Setup domain services

3. **Infrastructure Setup**
   - Configure Firebase repositories
   - Setup real-time listeners
   - Implement caching layer
   - Create health checks

### Phase 2: Core Functionality (Week 2)

1. **Messaging Features**
   - Implement conversation management
   - Message sending and delivery
   - Read receipts and status updates
   - Edit and delete functionality

2. **Notification Integration**
   - NotificationOrchestrator implementation
   - Batching logic
   - Push queue management
   - Preference handling

3. **Real-time Features**
   - SubscriptionManager implementation
   - WebSocket/SSE endpoints
   - Unread count tracking
   - Online presence (optional)

### Phase 3: Enhanced Features (Week 3)

1. **Message Enhancements**
   - Link preview extraction
   - Image thumbnail generation
   - File metadata extraction
   - Message search

2. **Advanced Notifications**
   - Quiet hours implementation
   - Notification grouping
   - Priority handling
   - Expiration management

3. **Performance Optimizations**
   - Query optimization
   - Caching strategies
   - Batch operations
   - Connection pooling

### Phase 4: Migration & Testing (Week 4)

1. **Data Migration**
   - Export existing data
   - Transform data structure
   - Import to new schema
   - Verify data integrity

2. **Integration Testing**
   - End-to-end test suites
   - Load testing
   - Real-time feature testing
   - Error scenario testing

3. **Service Cutover**
   - Update API Gateway routes
   - Deploy new service
   - Monitor performance
   - Gradual traffic migration

4. **Client Updates**
   - Update SDK mappings
   - Frontend integration
   - Mobile app updates
   - Documentation

## Benefits of Consolidation

### Performance Benefits

- **Single Firebase Connection**: Reduced connection overhead
- **Unified Subscriptions**: One real-time connection for all communication
- **Batch Operations**: Efficient bulk updates and queries
- **Shared Caching**: Better cache utilization

### Developer Experience

- **Single API Surface**: One service for all communication needs
- **Consistent Patterns**: Unified approach to real-time features
- **Simplified Integration**: No cross-service dependencies
- **Better Documentation**: Consolidated API documentation

### User Experience

- **Faster Updates**: Real-time synchronization
- **Consistent Behavior**: Unified notification handling
- **Better Offline Support**: Centralized queue management
- **Rich Features**: Enhanced messages with previews

### Maintenance Benefits

- **Reduced Complexity**: Single codebase to maintain
- **Unified Monitoring**: One service to monitor
- **Consistent Updates**: Features deployed together
- **Simplified Debugging**: Single log stream

## Risk Mitigation

### Technical Risks

1. **Data Migration Failures**
   - Mitigation: Comprehensive backup strategy
   - Rollback plan with data snapshots
   - Incremental migration approach

2. **Performance Degradation**
   - Mitigation: Load testing before cutover
   - Gradual traffic migration
   - Performance monitoring

3. **Real-time Connection Issues**
   - Mitigation: Connection pooling
   - Automatic reconnection logic
   - Fallback to polling

### Business Risks

1. **Service Downtime**
   - Mitigation: Blue-green deployment
   - Feature flags for gradual rollout
   - Rollback procedures

2. **Client Compatibility**
   - Mitigation: API versioning
   - Backward compatibility layer
   - Phased client updates

## Success Metrics

### Technical Metrics

- Response time < 200ms (p95)
- Real-time delivery < 100ms
- 99.9% uptime
- Zero data loss during migration

### Business Metrics

- Message delivery rate > 99.5%
- Notification open rate improvement
- Reduced support tickets
- Developer satisfaction score

### User Metrics

- Faster message delivery perception
- Increased engagement
- Reduced notification fatigue
- Better user satisfaction

## MVP Constraints

1. **Scope Limitations**
   - No email/SMS integration (future phase)
   - Basic push notifications only
   - Limited to 1-on-1 conversations
   - No voice/video calls

2. **Technical Constraints**
   - Firebase as primary datastore
   - No complex search (basic only)
   - Limited file size (10MB)
   - 30-day message retention

3. **Feature Constraints**
   - No end-to-end encryption
   - Basic rich media support
   - Limited customization options
   - No chatbot integration

## Future Enhancements (Post-MVP)

1. **Phase 2 Features**
   - Group conversations
   - Voice messages
   - Email notifications
   - Advanced search

2. **Phase 3 Features**
   - End-to-end encryption
   - Video messages
   - SMS notifications
   - AI-powered features

3. **Phase 4 Features**
   - Voice/video calls
   - Screen sharing
   - Chatbot integration
   - Advanced analytics

## Conclusion

The consolidation of notification and messaging services into a unified communication service will significantly improve the platform's architecture, performance, and maintainability. By following this plan and maintaining MVP-level simplicity, we can deliver a robust solution that serves as a solid foundation for future enhancements.

The key to success is maintaining clear boundaries, following established patterns, and focusing on core functionality while keeping the door open for future expansions.
