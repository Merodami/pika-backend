# Push Notification Implementation Plan for Pika

## Overview

This plan outlines the implementation of push notifications using Firebase Cloud Messaging (FCM) within the existing Pika microservices architecture, without requiring separate Firebase Functions deployment.

## Architecture Decision

### Chosen Approach: Backend-Triggered Push Notifications

- Push notifications are sent directly from the notification service
- No separate Firebase Functions deployment needed
- Maintains existing DDD/CQRS architecture
- Preserves all existing tests

## Implementation Plan

### Phase 1: Update Firebase Admin Configuration

#### 1.1 Update Firebase Configuration

**File**: `packages/shared/src/firebase/FirebaseAdminClient.ts`

**Status**: ✅ Already configured correctly

No changes needed - the existing FirebaseAdminClient already initializes Firebase Admin SDK properly.

#### 1.2 Update firebase.json

**File**: `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099,
      "host": "0.0.0.0"
    },
    "firestore": {
      "port": 8080,
      "host": "0.0.0.0"
    },
    "ui": {
      "enabled": true,
      "port": 4000,
      "host": "0.0.0.0"
    }
  }
}
```

**Action**: Remove the "functions" section to avoid deployment confusion.

### Phase 2: Implement Push Notification Sending

#### 2.1 Create Push Notification Types

**File**: `packages/services/notification/src/write/domain/types/PushNotification.ts`

```typescript
export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  badge?: number
  sound?: string
  icon?: string
  clickAction?: string
}

export interface PushNotificationResult {
  successCount: number
  failureCount: number
  failedTokens: string[]
}
```

#### 2.2 Create Push Notification Service

**File**: `packages/services/notification/src/write/infrastructure/push/PushNotificationService.ts`

```typescript
import { logger } from '@pika/shared'
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging'
import { PushNotificationPayload, PushNotificationResult } from '../../domain/types/PushNotification.js'

export class PushNotificationService {
  private messaging = getMessaging()

  async sendToTokens(tokens: string[], payload: PushNotificationPayload): Promise<PushNotificationResult> {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, failedTokens: [] }
    }

    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high' as const,
        notification: {
          icon: payload.icon || 'ic_notification',
          sound: payload.sound || 'default',
          clickAction: payload.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: payload.badge || 1,
            sound: payload.sound || 'default',
            alert: {
              title: payload.title,
              body: payload.body,
            },
          },
        },
      },
    }

    try {
      const response = await this.messaging.sendEachForMulticast(message)

      const failedTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx])
          logger.warn('Failed to send notification to token', {
            token: tokens[idx],
            error: resp.error?.message,
          })
        }
      })

      logger.info('Push notification sent', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      })

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      }
    } catch (error) {
      logger.error('Error sending push notification', error)
      throw error
    }
  }
}
```

#### 2.3 Update Firebase Notification Adapter

**File**: `packages/services/notification/src/write/infrastructure/firebase/FirebaseNotificationAdapter.ts`

Add push notification support to the existing adapter:

```typescript
import { PushNotificationService } from '../push/PushNotificationService.js'

export class FirebaseNotificationAdapter implements NotificationServicePort {
  private readonly db = FirebaseAdminClient.getInstance().firestore
  private readonly pushService = new PushNotificationService()

  async notifyNewMessage(params: NotifyNewMessageParams): Promise<void> {
    // 1. Create notification in Firestore (existing implementation)
    const notificationRef = this.db.collection('users').doc(params.recipientId).collection('notifications').doc()

    const notificationData = {
      id: notificationRef.id,
      userId: params.recipientId,
      type: 'MESSAGE_RECEIVED',
      title: 'New Message',
      body: params.content,
      entityRef: {
        entityType: 'message',
        entityId: params.messageId,
      },
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
      },
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await notificationRef.set(notificationData)

    // 2. Send push notification
    await this.sendPushNotificationToUser(params.recipientId, {
      title: notificationData.title,
      body: notificationData.body,
      data: {
        type: 'MESSAGE_RECEIVED',
        conversationId: params.conversationId,
        messageId: params.messageId,
        notificationId: notificationRef.id,
      },
    })
  }

  private async sendPushNotificationToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Get user's FCM tokens
      const userDoc = await this.db.collection('users').doc(userId).get()
      const userData = userDoc.data()
      const fcmTokens = userData?.fcmTokens || []

      if (fcmTokens.length === 0) {
        logger.debug('No FCM tokens found for user', { userId })
        return
      }

      // Send push notification
      const result = await this.pushService.sendToTokens(fcmTokens, payload)

      // Clean up failed tokens
      if (result.failedTokens.length > 0) {
        await this.removeInvalidTokens(userId, result.failedTokens)
      }
    } catch (error) {
      // Log error but don't throw - push notification failure shouldn't break the flow
      logger.error('Failed to send push notification', { userId, error })
    }
  }

  private async removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
    try {
      const userRef = this.db.collection('users').doc(userId)
      await userRef.update({
        fcmTokens: FieldValue.arrayRemove(...invalidTokens),
      })
      logger.info('Removed invalid FCM tokens', { userId, count: invalidTokens.length })
    } catch (error) {
      logger.error('Failed to remove invalid tokens', { userId, error })
    }
  }
}
```

### Phase 3: Integration with Messaging Service

#### 3.1 Create Notification Client

**File**: `packages/services/messaging/src/write/infrastructure/clients/NotificationClient.ts`

```typescript
import { logger } from '@pika/shared'

export interface NotificationPayload {
  userId: string
  type: string
  title: string
  body: string
  entityRef?: {
    entityType: string
    entityId: string
  }
}

export class NotificationClient {
  constructor(private readonly baseUrl: string) {}

  async publishNotification(payload: NotificationPayload): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Notification service returned ${response.status}`)
      }
    } catch (error) {
      // Log but don't throw - notification failure shouldn't break message sending
      logger.error('Failed to send notification', { error, payload })
    }
  }
}
```

#### 3.2 Update SendMessageCommandHandler

**File**: `packages/services/messaging/src/write/application/use_cases/commands/SendMessageCommandHandler.ts`

Add notification triggering after message creation:

```typescript
export class SendMessageCommandHandler {
  constructor(
    private readonly messageRepository: MessageRepositoryPort,
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly notificationClient: NotificationClient,
  ) {}

  async execute(command: SendMessageCommand): Promise<void> {
    // ... existing message creation logic ...

    // After message is successfully created and saved
    await this.triggerNotification(message, conversation)
  }

  private async triggerNotification(message: Message, conversation: Conversation): Promise<void> {
    // Find recipient
    const recipientId = Object.keys(conversation.participants).find((id) => id !== message.senderId)

    if (!recipientId) return

    // Send notification asynchronously
    this.notificationClient
      .publishNotification({
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        body: message.content,
        entityRef: {
          entityType: 'message',
          entityId: message.id,
        },
      })
      .catch((error) => {
        logger.error('Failed to trigger notification', { error, messageId: message.id })
      })
  }
}
```

### Phase 4: Testing Strategy

#### 4.1 Mock Push Notification Service for Tests

**File**: `packages/services/notification/src/write/infrastructure/push/__mocks__/PushNotificationService.ts`

```typescript
export class PushNotificationService {
  sendToTokens = vi.fn().mockResolvedValue({
    successCount: 1,
    failureCount: 0,
    failedTokens: [],
  })
}
```

#### 4.2 Update Test Configuration

**File**: `packages/services/notification/src/test/setup.ts`

```typescript
// Mock the push notification service
vi.mock('../write/infrastructure/push/PushNotificationService.js')
```

#### 4.3 Test Example

```typescript
describe('FirebaseNotificationAdapter', () => {
  it('should send push notification when notifying new message', async () => {
    const mockPushService = vi.mocked(PushNotificationService)

    // Test notification creation
    await adapter.notifyNewMessage({
      recipientId: 'user-123',
      senderId: 'user-456',
      conversationId: 'conv-789',
      messageId: 'msg-001',
      content: 'Hello',
    })

    // Verify push notification was attempted
    expect(mockPushService.prototype.sendToTokens).toHaveBeenCalled()
  })
})
```

### Phase 5: Environment Configuration

#### 5.1 Update Environment Variables

**File**: `.env`

```bash
# Notification Service Configuration
NOTIFICATION_SERVICE_URL=http://localhost:4004
INTERNAL_API_TOKEN=your-internal-api-token

# Firebase Configuration (if not already present)
FIREBASE_PROJECT_ID=pika-demo
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@pika-demo.iam.gserviceaccount.com
```

### Phase 6: Deployment & Monitoring

#### 6.1 Health Check Enhancement

Update the notification service health check to include FCM connectivity:

```typescript
async checkHealth(): Promise<HealthCheckResult> {
  const checks = await Promise.all([
    this.checkFirestore(),
    this.checkFCM(), // New check
  ]);

  return {
    status: checks.every(c => c.healthy) ? 'healthy' : 'unhealthy',
    services: checks,
  };
}

private async checkFCM(): Promise<ServiceHealth> {
  try {
    // Try to validate a dummy token
    await getMessaging().send({
      token: 'dummy-token',
      notification: { title: 'Health Check', body: 'Test' },
    }, true); // dryRun = true
    return { name: 'fcm', healthy: true };
  } catch (error) {
    // Expected to fail with invalid token, but connection should work
    if (error.code === 'messaging/invalid-registration-token') {
      return { name: 'fcm', healthy: true };
    }
    return { name: 'fcm', healthy: false, error: error.message };
  }
}
```

## Implementation Timeline

### Day 1: Infrastructure Setup

- [ ] Update firebase.json to remove functions
- [ ] Create PushNotificationService
- [ ] Update FirebaseNotificationAdapter
- [ ] Add necessary types and interfaces

### Day 2: Integration

- [ ] Create NotificationClient in messaging service
- [ ] Update SendMessageCommandHandler
- [ ] Add error handling and logging

### Day 3: Testing

- [ ] Create mocks for push notification service
- [ ] Update existing tests to handle new functionality
- [ ] Add new integration tests
- [ ] Test with Firebase emulator

### Day 4: Deployment Preparation

- [ ] Update environment configurations
- [ ] Add monitoring and health checks
- [ ] Create deployment documentation
- [ ] Test in staging environment

## Testing Commands

```bash
# Run all tests except messaging and notification (existing)
yarn vitest

# Run notification service tests in isolation
yarn nx run @pika/notification:test

# Run messaging service tests in isolation
yarn nx run @pika/messaging:test

# Run integration tests with emulator
yarn docker:test
yarn test:integration
```

## Rollback Plan

If issues arise:

1. The push notification sending is isolated and won't affect core functionality
2. Can disable push notifications by feature flag
3. Notification creation in Firestore continues to work
4. Frontend real-time listeners remain unaffected

## Monitoring & Observability

### Metrics to Track

- Push notification success/failure rates
- FCM token validity rates
- Notification delivery latency
- Failed token cleanup frequency

### Logging

- All push notification attempts are logged
- Failed tokens are logged for debugging
- Notification service health is monitored

## Security Considerations

1. **Internal API Token**: Used for service-to-service communication
2. **FCM Tokens**: Stored securely in Firestore with proper access rules
3. **Rate Limiting**: Implement rate limiting on notification endpoints
4. **Token Validation**: Regular cleanup of invalid FCM tokens

## Future Enhancements

1. **Batch Notifications**: Send notifications in batches for better performance
2. **Template System**: Create notification templates for different types
3. **Scheduling**: Add support for scheduled notifications
4. **Analytics**: Track notification open rates and engagement
5. **Multi-channel**: Add email and SMS channels

## Conclusion

This implementation plan:

- ✅ Maintains existing test integrity
- ✅ Follows microservices best practices
- ✅ Avoids Firebase Functions complexity
- ✅ Provides proper error handling
- ✅ Supports easy rollback
- ✅ Enables monitoring and observability

The approach aligns with the existing Pika architecture while adding robust push notification capabilities.
