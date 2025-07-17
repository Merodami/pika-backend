import { ErrorFactory } from '@pika/shared'
import type { FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PublishNotificationCommandHandler } from '../../application/index.js'
import { NotificationType } from '../../domain/index.js'
import { NotificationController } from './NotificationController.js'

describe('NotificationController', () => {
  let controller: NotificationController
  let mockPublishHandler: PublishNotificationCommandHandler
  let mockMarkAsReadHandler: any
  let mockMarkAllAsReadHandler: any
  let mockRequest: FastifyRequest

  beforeEach(() => {
    mockPublishHandler = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as any

    mockMarkAsReadHandler = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as any

    mockMarkAllAsReadHandler = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as any

    controller = new NotificationController(
      mockPublishHandler,
      mockMarkAsReadHandler,
      mockMarkAllAsReadHandler,
    )

    mockRequest = {
      body: {},
      headers: {
        'x-user-id': '123e4567-e89b-12d3-a456-426614174000',
        'x-user-email': 'admin@test.com',
        'x-user-role': 'ADMIN',
        'x-user-status': 'ACTIVE',
      },
      log: {
        error: vi.fn(),
      },
      id: 'test-request-id',
    } as any
  })

  describe('publish', () => {
    it('should publish notification successfully', async () => {
      const notificationData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Update',
        body: 'You have a new system announcement',
      }

      mockRequest.body = notificationData

      const result = await controller.publish(mockRequest)

      expect(mockPublishHandler.execute).toHaveBeenCalledWith(notificationData)
      expect(result).toEqual({ success: true })
    })

    it('should handle optional fields in notification', async () => {
      const notificationData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.VOUCHER_UPDATED,
        title: 'Voucher Updated',
        body: 'Your voucher has been updated',
        icon: 'update.png',
        entityRef: {
          entityType: 'voucher',
          entityId: '456e7890-e89b-12d3-a456-426614174001',
        },
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      }

      mockRequest.body = notificationData

      const result = await controller.publish(mockRequest)

      expect(mockPublishHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          body: notificationData.body,
          icon: notificationData.icon,
          entityRef: notificationData.entityRef,
          expiresAt: expect.any(Date),
        }),
      )
      expect(result).toEqual({ success: true })
    })

    it('should handle handler errors', async () => {
      const notificationData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment Failed',
        body: 'Your payment could not be processed',
      }

      const error = new Error('Database connection failed')

      mockPublishHandler.execute = vi.fn().mockRejectedValue(error)
      mockRequest.body = notificationData

      await expect(controller.publish(mockRequest)).rejects.toThrow(
        'Database connection failed',
      )

      expect(mockPublishHandler.execute).toHaveBeenCalledWith(notificationData)
    })

    it('should handle domain validation errors', async () => {
      const notificationData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.MESSAGE_RECEIVED,
        title: '', // Empty title
        body: 'You have a new message',
      }

      // No need to mock the handler since the controller will catch this before calling the handler
      mockRequest.body = notificationData

      await expect(controller.publish(mockRequest)).rejects.toThrowError()
    })

    it('should handle all notification types', async () => {
      const notificationTypes = Object.values(NotificationType)

      for (const type of notificationTypes) {
        const notificationData = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          type,
          title: `${type} Notification`,
          body: `This is a ${type} notification`,
        }

        mockRequest.body = notificationData
        await controller.publish(mockRequest)

        expect(mockPublishHandler.execute).toHaveBeenCalledWith(
          notificationData,
        )
      }

      expect(mockPublishHandler.execute).toHaveBeenCalledTimes(
        notificationTypes.length,
      )
    })

    it('should pass through ErrorFactory errors', async () => {
      const notificationData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.REVIEW_RECEIVED,
        title: 'New Review',
        body: 'You have received a new review',
      }

      const customError = ErrorFactory.validationError(
        { userId: ['Invalid user ID format'] },
        {
          source: 'PublishNotificationCommandHandler',
          context: { field: 'userId', value: 'invalid' },
        },
      )

      mockPublishHandler.execute = vi.fn().mockRejectedValue(customError)
      mockRequest.body = notificationData

      await expect(controller.publish(mockRequest)).rejects.toThrow(
        'Validation error',
      )
    })

    it('should handle entity reference validation', async () => {
      const notificationData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'Your voucher has been claimed',
        entityRef: {
          entityType: 'voucher',
          entityId: 'invalid-uuid', // Invalid UUID format
        },
      }

      const error = new Error('Invalid EntityRef data')

      mockPublishHandler.execute = vi.fn().mockRejectedValue(error)
      mockRequest.body = notificationData

      await expect(controller.publish(mockRequest)).rejects.toThrow(
        'Invalid EntityRef data',
      )
    })

    it('should not modify request body', async () => {
      const notificationData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Maintenance',
        body: 'Scheduled maintenance at 2 AM',
      }

      const originalData = { ...notificationData }

      mockRequest.body = notificationData

      await controller.publish(mockRequest)

      expect(mockRequest.body).toEqual(originalData)
    })
  })
})
