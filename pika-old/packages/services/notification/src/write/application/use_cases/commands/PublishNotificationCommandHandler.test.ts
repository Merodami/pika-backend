import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Notification, NotificationType } from '../../../domain/index.js'
import type { NotificationServicePort } from '../../ports/NotificationServicePort.js'
import {
  PublishNotificationCommand,
  PublishNotificationCommandHandler,
} from './PublishNotificationCommandHandler.js'

describe('PublishNotificationCommandHandler', () => {
  let handler: PublishNotificationCommandHandler
  let mockNotificationService: NotificationServicePort

  beforeEach(() => {
    mockNotificationService = {
      publish: vi.fn().mockResolvedValue(undefined),
      publishBatch: vi.fn().mockResolvedValue(undefined),
    }
    handler = new PublishNotificationCommandHandler(mockNotificationService)
  })

  describe('execute', () => {
    it('should create and publish a notification with all required fields', async () => {
      const command: PublishNotificationCommand = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
      }

      await handler.execute(command)

      expect(mockNotificationService.publish).toHaveBeenCalledTimes(1)
      expect(mockNotificationService.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: command.userId,
          type: command.type,
          title: command.title,
          body: command.body,
          read: false,
        }),
      )
    })

    it('should include optional fields when provided', async () => {
      const command: PublishNotificationCommand = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.SERVICE_UPDATED,
        title: 'Service Updated',
        body: 'Your service has been updated',
        icon: 'update-icon.png',
        entityRef: {
          entityType: 'service',
          entityId: '123e4567-e89b-12d3-a456-426614174001',
        },
        expiresAt: '2024-12-31T23:59:59Z',
      }

      await handler.execute(command)

      const publishCall = vi.mocked(mockNotificationService.publish).mock
        .calls[0][0]

      expect(publishCall).toBeInstanceOf(Notification)
      expect(publishCall.icon).toBe(command.icon)
      expect(publishCall.entityRef?.entityType).toBe(
        command.entityRef.entityType,
      )
      expect(publishCall.entityRef?.entityId).toBe(command.entityRef.entityId)
      expect(publishCall.expiresAt).toBeInstanceOf(Date)
      expect(publishCall.expiresAt?.toISOString()).toBe(
        new Date(command.expiresAt).toISOString(),
      )
    })

    it('should generate unique notification ID', async () => {
      const command: PublishNotificationCommand = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        body: 'You have received a new message',
      }

      await handler.execute(command)

      const publishCall = vi.mocked(mockNotificationService.publish).mock
        .calls[0][0]

      expect(publishCall.id).toBeDefined()
      expect(publishCall.id).toMatch(/^[a-f0-9-]{36}$/)
    })

    it('should set createdAt timestamp', async () => {
      const beforeTime = new Date()

      const command: PublishNotificationCommand = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Payment Received',
        body: 'Your payment has been received',
      }

      await handler.execute(command)

      const afterTime = new Date()

      const publishCall = vi.mocked(mockNotificationService.publish).mock
        .calls[0][0]

      expect(publishCall.createdAt).toBeDefined()
      expect(publishCall.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      )
      expect(publishCall.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      )
    })

    it('should handle all notification types', async () => {
      const notificationTypes = Object.values(NotificationType)

      for (const type of notificationTypes) {
        const command: PublishNotificationCommand = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          type,
          title: `${type} Notification`,
          body: `This is a ${type} notification`,
        }

        await handler.execute(command)
      }

      expect(mockNotificationService.publish).toHaveBeenCalledTimes(
        notificationTypes.length,
      )
    })

    it('should propagate errors from notification service', async () => {
      const error = new Error('Failed to publish notification')

      mockNotificationService.publish = vi.fn().mockRejectedValue(error)

      const command: PublishNotificationCommand = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Update',
        body: 'System maintenance scheduled',
      }

      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to publish notification',
      )
    })

    it('should parse expiresAt string to Date object', async () => {
      const expiresAtString = '2025-01-01T00:00:00Z'
      const command: PublishNotificationCommand = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.VOUCHER_REDEEMED,
        title: 'Voucher Redeemed',
        body: 'Your voucher has been redeemed',
        expiresAt: expiresAtString,
      }

      await handler.execute(command)

      const publishCall = vi.mocked(mockNotificationService.publish).mock
        .calls[0][0]

      expect(publishCall.expiresAt).toBeInstanceOf(Date)
      expect(publishCall.expiresAt?.toISOString()).toBe(
        '2025-01-01T00:00:00.000Z',
      )
    })

    it('should handle notification with entity reference', async () => {
      const command: PublishNotificationCommand = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        entityRef: {
          entityType: 'voucher',
          entityId: '123e4567-e89b-12d3-a456-426614174002',
        },
      }

      await handler.execute(command)

      const publishCall = vi.mocked(mockNotificationService.publish).mock
        .calls[0][0]

      expect(publishCall.entityRef).toBeDefined()
      expect(publishCall.entityRef?.entityType).toBe('voucher')
      expect(publishCall.entityRef?.entityId).toBe(
        '123e4567-e89b-12d3-a456-426614174002',
      )
    })
  })
})
