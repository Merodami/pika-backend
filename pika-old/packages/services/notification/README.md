# Notification Service

A generic notification service for the Pika platform that handles in-app notifications and push notifications via Firebase.

## Architecture

The notification service follows Domain-Driven Design (DDD) with CQRS pattern:

- **Write Side**: Handles notification creation and publishing
- **Read Side**: Handles notification queries and marking as read
- **Infrastructure**: Firebase Firestore for persistence and Firebase Cloud Messaging for push notifications

## Features

- **In-app notifications**: Stored in Firestore, accessible via API
- **Push notifications**: Sent via Firebase Cloud Messaging (FCM)
- **Notification types**: Support for various notification types (voucher, payment, messages, etc.)
- **Entity references**: Link notifications to specific entities (vouchers, redemptions, etc.)
- **Expiration**: Optional expiration dates for time-sensitive notifications
- **Batch operations**: Support for sending multiple notifications efficiently

## API Endpoints

### Publish Notification

```
POST /api/v1/notifications/publish
```

Request body:

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "BOOKING_CREATED",
  "title": "New Voucher",
  "body": "You have a new voucher available",
  "icon": "voucher-icon.png",
  "entityRef": {
    "entityType": "voucher",
    "entityId": "456e7890-e89b-12d3-a456-426614174001"
  },
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

## Notification Types

- `VOUCHER_CREATED`: New voucher created
- `VOUCHER_CLAIMED`: Voucher claimed
- `VOUCHER_REDEEMED`: Voucher redeemed
- `SERVICE_UPDATED`: Service information updated
- `SERVICE_RESCHEDULED`: Service rescheduled
- `PAYMENT_RECEIVED`: Payment received
- `PAYMENT_FAILED`: Payment failed
- `MESSAGE_RECEIVED`: New message received
- `REVIEW_RECEIVED`: New review received
- `SYSTEM_ANNOUNCEMENT`: System-wide announcement

## Firebase Integration

### Firestore Structure

```
users/{userId}/notifications/{notificationId}
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
```

### Cloud Function

The `pushOnNewNotification` function triggers when a new notification is created in Firestore and:

1. Retrieves user's FCM tokens
2. Sends push notification via FCM
3. Handles invalid tokens by removing them from user profile

## Configuration

Required environment variables:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_DATABASE_URL=your-database-url
FIREBASE_STORAGE_BUCKET=your-storage-bucket

# Firebase Emulator (for testing)
USE_FIREBASE_EMULATOR=true
FIREBASE_EMULATOR_HOST=localhost
FIREBASE_FIRESTORE_PORT=8080
FIREBASE_AUTH_PORT=9099
FIREBASE_FUNCTIONS_PORT=5001

# Notification Settings
NOTIFICATION_EXPIRATION_DAYS=30
NOTIFICATION_BATCH_SIZE=500
NOTIFICATION_CLEANUP_INTERVAL_HOURS=24

# Service Port
NOTIFICATION_SERVICE_PORT=4004
```

## Development

### Running Locally

```bash
# Start the notification service
yarn nx run @pika/notification:local
```

### Running Tests

```bash
# Run unit tests
yarn nx run @pika/notification:test

# Run with Firebase emulator
docker-compose -f docker-compose.test.yml up -d
yarn nx run @pika/notification:test
```

## Integration with Other Services

Other services can publish notifications by:

1. Raising domain events (e.g., `VoucherClaimed`, `VoucherRedeemed`)
2. Event handlers call the notification service API to publish notifications

Example integration:

```typescript
// In voucher service
class VoucherClaimedEventHandler {
  async handle(event: VoucherClaimedEvent) {
    await notificationClient.publish({
      userId: event.customerId,
      type: 'BOOKING_CREATED',
      title: 'Voucher Claimed',
      body: `Your voucher for ${event.voucherTitle} has been claimed`,
      entityRef: {
        entityType: 'voucher',
        entityId: event.voucherId,
      },
    })
  }
}
```

## Security

- Notifications are scoped to users (users can only access their own notifications)
- Only backend services can create notifications (enforced by Firestore rules)
- Users can only update the `read` field of their notifications
- FCM tokens are validated and cleaned up automatically

## Future Enhancements

- Email notifications via SendGrid/SES
- SMS notifications via Twilio
- Notification preferences per user
- Notification templates
- Rich media support (images, actions)
- Real-time updates via WebSockets
