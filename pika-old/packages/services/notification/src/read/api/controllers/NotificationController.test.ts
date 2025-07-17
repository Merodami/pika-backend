import type { GetUserNotificationsHandler } from '@notification-read/application/index.js'
import type { FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationReadController } from './NotificationController.js'

describe('NotificationReadController', () => {
  let controller: NotificationReadController
  let mockGetNotificationsHandler: GetUserNotificationsHandler
  let mockRequest: FastifyRequest

  beforeEach(() => {
    // Mock handler
    mockGetNotificationsHandler = {
      execute: vi.fn(),
    } as unknown as GetUserNotificationsHandler

    // Create controller instance
    controller = new NotificationReadController(mockGetNotificationsHandler)

    // Mock request
    mockRequest = {
      query: {},
      headers: {
        'x-user-id': 'user123',
        'x-user-email': 'user@test.com',
        'x-user-role': 'CUSTOMER',
        'x-user-status': 'ACTIVE',
      },
      params: {},
      id: 'test-request-id',
    } as unknown as FastifyRequest
  })

  describe('getUserNotifications', () => {
    it('should get user notifications from user context', async () => {
      const mockResult = {
        notifications: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: 'user123',
            type: 'SYSTEM_ANNOUNCEMENT',
            title: 'System Update',
            body: 'You have a new announcement',
            read: false,
            createdAt: new Date('2025-01-26T12:00:00Z'),
          },
        ],
        unreadCount: 1,
        total: 1,
      }

      mockGetNotificationsHandler.execute = vi
        .fn()
        .mockResolvedValue(mockResult)
      mockRequest.query = {}

      const result = await controller.getUserNotifications(mockRequest)

      expect(mockGetNotificationsHandler.execute).toHaveBeenCalledWith({
        userId: 'user123',
        limit: undefined,
        offset: undefined,
        unreadOnly: undefined,
        types: undefined,
      })

      // The controller should return the mapped result
      expect(result).toHaveProperty('notifications')
      expect(result).toHaveProperty('unreadCount', 1)
      expect(result).toHaveProperty('total', 1)
    })

    it('should get user id from headers', async () => {
      const mockResult = {
        notifications: [],
        unreadCount: 0,
        total: 0,
      }

      mockGetNotificationsHandler.execute = vi
        .fn()
        .mockResolvedValue(mockResult)

      // Update user ID in headers
      mockRequest.headers['x-user-id'] = 'user456'

      await controller.getUserNotifications(mockRequest)

      expect(mockGetNotificationsHandler.execute).toHaveBeenCalledWith({
        userId: 'user456',
        limit: undefined,
        offset: undefined,
        unreadOnly: undefined,
        types: undefined,
      })
    })

    it('should pass query parameters correctly', async () => {
      mockGetNotificationsHandler.execute = vi.fn().mockResolvedValue({
        notifications: [],
        unreadCount: 0,
        total: 0,
      })
      mockRequest.query = {
        limit: 10,
        offset: 20,
        unreadOnly: true,
        types: ['SYSTEM_ANNOUNCEMENT', 'PAYMENT_RECEIVED'],
      }

      await controller.getUserNotifications(mockRequest)

      expect(mockGetNotificationsHandler.execute).toHaveBeenCalledWith({
        userId: 'user123',
        limit: 10,
        offset: 20,
        unreadOnly: true,
        types: ['SYSTEM_ANNOUNCEMENT', 'PAYMENT_RECEIVED'],
      })
    })

    it('should handle handler errors', async () => {
      const error = new Error('Database error')

      mockGetNotificationsHandler.execute = vi.fn().mockRejectedValue(error)

      await expect(
        controller.getUserNotifications(mockRequest),
      ).rejects.toThrow('Database error')
    })
  })
})
