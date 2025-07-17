import type { PublishNotificationCommand } from '@notification-write/application/index.js'
import { NotificationType } from '@notification-write/domain/index.js'

export const notificationFixtures = {
  commands: {
    publishNotification: (
      overrides?: Partial<PublishNotificationCommand>,
    ): PublishNotificationCommand => ({
      userId: '123e4567-e89b-12d3-a456-426614174001',
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Test Notification',
      body: 'This is a test notification body',
      ...overrides,
    }),
  },

  entities: {
    notification: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Test Notification',
      body: 'This is a test notification body',
      read: false,
      createdAt: new Date('2025-01-26T12:00:00Z'),
    },
  },

  api: {
    publishRequest: {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'System Update',
      body: 'System maintenance scheduled',
      icon: 'system-icon.png',
      entityRef: {
        entityType: 'system',
        entityId: '123e4567-e89b-12d3-a456-426614174002',
      },
      expiresAt: '2025-02-26T12:00:00Z',
    },
  },
}
