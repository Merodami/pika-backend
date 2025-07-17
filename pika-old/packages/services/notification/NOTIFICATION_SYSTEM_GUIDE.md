# Pika Notification System Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How to Use](#how-to-use)
4. [How to Implement](#how-to-implement)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Overview

The Pika notification system is a Firebase-based microservice that handles both in-app notifications and push notifications. It follows Domain-Driven Design (DDD) with CQRS pattern and integrates seamlessly with Firebase Cloud Messaging (FCM) for push notifications.

⏺ Based on my analysis, your notification implementation has excellent potential for a service marketplace. Here are the key use cases:

Core Marketplace Notifications

Booking Lifecycle (already supported):

- New booking requests from customers
- Provider confirmations/rejections
- Rescheduling notifications
- Cancellations from either party
- Booking reminders (24h/1h before service)

Payment & Transactions:

- Payment confirmations
- Failed payment alerts
- Refund notifications
- Invoice availability

Provider-Customer Messaging:

- Direct messages between parties
- Service inquiries
- Quote requests/responses
- Post-service follow-ups

High-Value Additions

Provider Management:

- New provider applications
- Verification status updates
- Performance metrics alerts
- Service suspension warnings

Customer Engagement:

- Review reminders after service
- Favorite provider availability
- Price drops on saved services
- Personalized recommendations

Platform Operations:

- Security alerts (new logins)
- Account verification reminders
- Terms of service updates
- System maintenance notices

The entityRef field in your implementation is particularly powerful - it allows notifications to link directly to bookings, services, users, or any other entity, making the system highly flexible for
future expansion.

Your Firebase integration also supports real-time updates and push notifications, essential for time-sensitive marketplace operations like "provider is on the way" or last-minute cancellations.

### Key Features

- 📱 Push notifications to mobile and web devices
- 📬 In-app notification storage and retrieval
- 🔄 Real-time updates via Firestore
- 🔒 Secure user-specific notifications
- 📊 Entity-linked notifications (bookings, services, etc.)
- ⏰ Notification expiration support
- 🚀 Batch notification operations
- 🧪 Firebase emulator support for local development

## Architecture

### Service Structure

```
packages/services/notification/
├── src/
│   ├── write/                    # Command side (CQRS)
│   │   ├── api/                  # HTTP layer
│   │   ├── application/          # Use cases
│   │   ├── domain/               # Business logic
│   │   └── infrastructure/       # Firebase integration
│   └── read/                     # Query side (CQRS)
│       └── [same structure]
```

### Firebase Structure

```
Firestore:
users/
  {userId}/
    notifications/
      {notificationId}/
        - id: string
        - userId: string
        - type: NotificationType
        - title: string
        - body: string
        - icon?: string
        - entityRef?: { entityType, entityId }
        - read: boolean
        - createdAt: timestamp
        - expiresAt?: timestamp
    fcmTokens: string[]  # Array of device tokens

Firebase Functions:
- pushOnNewNotification: Triggered on notification creation
```

### Notification Types

```typescript
enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  SERVICE_UPDATED = 'SERVICE_UPDATED',
  SERVICE_RESCHEDULED = 'SERVICE_RESCHEDULED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}
```

## How to Use

### 1. Local Development Setup

#### Start Firebase Emulator

```bash
# Using docker-compose (recommended)
yarn docker:test

# Or manually
firebase emulators:start --only firestore,auth,functions --project pika-demo
```

#### Configure Environment

```bash
# .env file
FIREBASE_EMULATOR=true
FIREBASE_PROJECT_ID=pika-demo
NOTIFICATION_SERVICE_PORT=4004
```

#### Start Notification Service

```bash
# Start the notification service
yarn nx run @pika/notification:local

# Or start all services
yarn local
```

### 2. Publishing Notifications

#### From Another Service

```typescript
// Example: Voucher service notifying retailer
import { NotificationType } from '@types/notification/notification.dto.js'

async function notifyRetailerOfVoucherClaim(voucher: Voucher) {
  const notification = {
    userId: voucher.retailerId,
    type: NotificationType.VOUCHER_CLAIMED,
    title: 'Voucher Claimed',
    body: `${voucher.customerName} has claimed your voucher: ${voucher.title}`,
    data: {
      voucherId: voucher.id,
      customerId: voucher.customerId,
      retailerId: voucher.retailerId,
      claimedAt: voucher.claimedAt.toISOString(),
    },
    entityRef: {
      entityType: 'voucher',
      entityId: voucher.id,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }

  const response = await fetch('http://localhost:4004/api/v1/notifications/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': generateCorrelationId(),
    },
    body: JSON.stringify(notification),
  })

  if (!response.ok) {
    throw new Error(`Failed to send notification: ${response.statusText}`)
  }
}
```

#### Direct API Call

```bash
curl -X POST http://localhost:4004/api/v1/notifications/publish \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "type": "VOUCHER_CLAIMED",
    "title": "Voucher Claimed",
    "body": "A customer has claimed your voucher",
    "data": {
      "voucherId": "voucher456"
    },
    "entityRef": {
      "entityType": "voucher",
      "entityId": "voucher456"
    }
  }'
```

### 3. Retrieving Notifications

#### Get User Notifications (Not yet wired in API)

```typescript
// This endpoint exists but needs to be added to server.ts routes
GET /api/v1/notifications?userId=user123&page=1&limit=20&includeRead=false
```

#### Direct Firestore Access (Frontend)

```typescript
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Real-time notification listener
function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const notificationsRef = collection(db, 'users', userId, 'notifications')
  const q = query(notificationsRef, where('read', '==', false), orderBy('createdAt', 'desc'), limit(20))

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    callback(notifications)
  })
}
```

### 4. Marking Notifications as Read

#### Frontend Implementation

```typescript
import { doc, updateDoc } from 'firebase/firestore'

async function markAsRead(userId: string, notificationId: string) {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId)
  await updateDoc(notificationRef, {
    read: true,
  })
}

// Mark multiple as read
async function markAllAsRead(userId: string, notificationIds: string[]) {
  const batch = writeBatch(db)

  notificationIds.forEach((id) => {
    const ref = doc(db, 'users', userId, 'notifications', id)
    batch.update(ref, { read: true })
  })

  await batch.commit()
}
```

### 5. Push Notification Setup

#### Frontend Token Registration

```typescript
import { getMessaging, getToken } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'

async function registerForPushNotifications(userId: string) {
  try {
    const messaging = getMessaging()

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    // Save token to user document
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      lastTokenUpdate: new Date(),
    })

    console.log('FCM token registered:', token)
  } catch (error) {
    console.error('Error registering for push notifications:', error)
  }
}

// Handle token refresh
messaging.onTokenRefresh(async () => {
  const newToken = await getToken(messaging)
  // Update token in Firestore
})
```

## How to Implement

### 1. Adding New Notification Types

#### Step 1: Update Notification Type Enum

```typescript
// packages/types/src/notification/notification.dto.ts
export enum NotificationType {
  // ... existing types
  YOUR_NEW_TYPE = 'YOUR_NEW_TYPE',
}
```

#### Step 2: Create Notification Publisher

```typescript
// In your service (e.g., packages/services/your-service/src/infrastructure/notification/NotificationPublisher.ts)
export class NotificationPublisher {
  private readonly notificationServiceUrl: string

  constructor() {
    this.notificationServiceUrl = config.get('NOTIFICATION_SERVICE_URL') || 'http://localhost:4004'
  }

  async publishYourEvent(userId: string, data: YourEventData): Promise<void> {
    const notification = {
      userId,
      type: NotificationType.YOUR_NEW_TYPE,
      title: this.generateTitle(data),
      body: this.generateBody(data),
      data: this.extractNotificationData(data),
      entityRef: {
        entityType: 'your-entity',
        entityId: data.entityId,
      },
    }

    await this.publish(notification)
  }

  private async publish(notification: any): Promise<void> {
    const response = await fetch(`${this.notificationServiceUrl}/api/v1/notifications/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': generateCorrelationId(),
      },
      body: JSON.stringify(notification),
    })

    if (!response.ok) {
      throw new Error(`Failed to publish notification: ${response.statusText}`)
    }
  }
}
```

#### Step 3: Integrate with Your Use Cases

```typescript
// In your command handler
export class YourCommandHandler {
  constructor(
    private readonly repository: YourRepository,
    private readonly notificationPublisher: NotificationPublisher,
  ) {}

  async execute(command: YourCommand): Promise<void> {
    // Your business logic
    const result = await this.repository.save(entity)

    // Publish notification
    await this.notificationPublisher.publishYourEvent(result.userId, {
      entityId: result.id,
      // ... other data
    })
  }
}
```

### 2. Implementing Read Endpoints

The read endpoints are defined but not wired up. To complete the implementation:

#### Step 1: Wire Routes in server.ts

```typescript
// packages/services/notification/src/read/api/server.ts
// Add after line 46 (health check route)

// Get user notifications
server.get('/api/v1/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
  const controller = new NotificationController(
    container.resolve('getUserNotificationsHandler'),
    container.resolve('markAsReadHandler'), // Not implemented yet
  )
  return controller.getUserNotifications(request, reply)
})

// Mark as read
server.patch('/api/v1/notifications/:notificationId/read', async (request: FastifyRequest, reply: FastifyReply) => {
  const controller = new NotificationController(
    container.resolve('getUserNotificationsHandler'),
    container.resolve('markAsReadHandler'), // Needs implementation
  )
  return controller.markAsRead(request, reply)
})
```

#### Step 2: Implement Mark as Read Handler

```typescript
// packages/services/notification/src/read/application/use_cases/commands/MarkAsReadHandler.ts
export class MarkAsReadHandler {
  constructor(private readonly repository: NotificationRepositoryPort) {}

  async execute(command: MarkAsReadCommand): Promise<void> {
    const notification = await this.repository.findById(command.notificationId)

    if (!notification) {
      throw ErrorFactory.notFound('NOTIFICATION_NOT_FOUND', {
        source: 'MarkAsReadHandler',
        context: { notificationId: command.notificationId },
      })
    }

    if (notification.userId !== command.userId) {
      throw ErrorFactory.forbidden('UNAUTHORIZED_ACCESS', {
        source: 'MarkAsReadHandler',
        context: { userId: command.userId, notificationId: command.notificationId },
      })
    }

    await this.repository.markAsRead(command.notificationId)
  }
}
```

### 3. Implementing Batch Operations

```typescript
// Batch publish notifications
export class BatchNotificationPublisher {
  async publishBatch(notifications: NotificationInput[]): Promise<void> {
    const BATCH_SIZE = 100

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map((notification) => this.publish(notification)))

      // Add delay to avoid rate limiting
      if (i + BATCH_SIZE < notifications.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  }
}
```

### 4. Adding Email/SMS Support

```typescript
// Extend the notification adapter
export class MultiChannelNotificationAdapter {
  constructor(
    private readonly firebaseAdapter: FirebaseNotificationAdapter,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async publish(notification: Notification): Promise<void> {
    // Always save to Firestore
    await this.firebaseAdapter.save(notification)

    // Check user preferences
    const preferences = await this.getUserPreferences(notification.userId)

    // Send via additional channels
    const promises: Promise<void>[] = []

    if (preferences.emailEnabled && this.shouldSendEmail(notification.type)) {
      promises.push(this.sendEmail(notification))
    }

    if (preferences.smsEnabled && this.shouldSendSms(notification.type)) {
      promises.push(this.sendSms(notification))
    }

    await Promise.allSettled(promises)
  }

  private async sendEmail(notification: Notification): Promise<void> {
    const user = await this.getUserDetails(notification.userId)

    await this.emailService.send({
      to: user.email,
      subject: notification.title,
      template: 'notification',
      data: {
        title: notification.title,
        body: notification.body,
        actionUrl: this.generateActionUrl(notification),
      },
    })
  }

  private async sendSms(notification: Notification): Promise<void> {
    const user = await this.getUserDetails(notification.userId)

    if (!user.phoneNumber) return

    await this.smsService.send({
      to: user.phoneNumber,
      message: `${notification.title}: ${notification.body}`,
    })
  }
}
```

## Testing

### 1. Unit Testing

```typescript
// Example unit test
describe('PublishNotificationCommandHandler', () => {
  it('should create and publish notification', async () => {
    const mockAdapter = {
      save: vi.fn().mockResolvedValue(undefined),
    }

    const handler = new PublishNotificationCommandHandler(mockAdapter)

    const command = new PublishNotificationCommand({
      userId: 'user123',
      type: NotificationType.BOOKING_CREATED,
      title: 'Test',
      body: 'Test notification',
    })

    await handler.execute(command)

    expect(mockAdapter.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user123',
        type: NotificationType.BOOKING_CREATED,
      }),
    )
  })
})
```

### 2. Integration Testing

```typescript
// Using Firebase emulator
describe('Notification API Integration', () => {
  beforeAll(async () => {
    // Start Firebase emulator
    await startFirebaseEmulator()
  })

  it('should publish notification and trigger push', async () => {
    const notification = {
      userId: 'test-user',
      type: NotificationType.BOOKING_CREATED,
      title: 'Integration Test',
      body: 'Testing notification flow',
    }

    const response = await request(app).post('/api/v1/notifications/publish').send(notification).expect(201)

    // Verify notification saved in Firestore
    const doc = await firestore.collection('users').doc('test-user').collection('notifications').doc(response.body.id).get()

    expect(doc.exists).toBe(true)
    expect(doc.data()).toMatchObject(notification)
  })
})
```

### 3. Testing Push Notifications

```bash
# Send test notification via Firebase Console
# Or use this script:
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_TOKEN",
    "notification": {
      "title": "Test Push",
      "body": "This is a test notification"
    },
    "data": {
      "notificationId": "test123"
    }
  }'
```

## Troubleshooting

### Common Issues

#### 1. Firebase Emulator Not Starting

```bash
# Check if ports are in use
lsof -i :8080
lsof -i :4000

# Kill processes if needed
kill -9 <PID>

# Restart emulator
yarn docker:test
```

#### 2. Push Notifications Not Received

- Check FCM token is valid and stored in Firestore
- Verify Firebase Cloud Function is deployed
- Check device notification permissions
- Review Firebase Console for error messages

#### 3. Notifications Not Saving

- Verify Firebase credentials are configured
- Check Firestore rules allow write access
- Ensure notification service is running
- Check logs for validation errors

#### 4. Authentication Issues

- Ensure user ID is passed in headers or JWT
- Verify Firestore rules match your auth pattern
- Check service-to-service authentication

### Debugging Tips

```typescript
// Enable debug logging
export DEBUG=pika:notification:*

// Check Firebase connection
const admin = getFirebaseAdmin();
console.log('Firebase initialized:', admin.apps.length > 0);

// Test Firestore write
const testDoc = await admin.firestore()
  .collection('test')
  .add({ test: true });
console.log('Test write successful:', testDoc.id);
```

### Performance Optimization

1. **Batch Operations**: Use Firestore batch writes for multiple notifications
2. **Pagination**: Implement cursor-based pagination for large notification lists
3. **Indexing**: Create Firestore indexes for common queries
4. **Caching**: Cache frequently accessed notifications in Redis
5. **Cleanup**: Implement scheduled job to remove expired notifications

## Next Steps

1. **Complete Read API Implementation**: Wire up the remaining endpoints
2. **Add Authentication Middleware**: Implement proper JWT validation
3. **Implement Notification Preferences**: Allow users to configure notification settings
4. **Add Analytics**: Track notification delivery and engagement
5. **Implement Templates**: Create reusable notification templates
6. **Add Rich Media**: Support images and action buttons in notifications
7. **Implement Scheduling**: Allow scheduled notifications
8. **Add Localization**: Support multiple languages based on user preferences
