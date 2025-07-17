import type { NotificationReadRepositoryPort } from '@notification-read/domain/index.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GetUserNotificationsQuery } from './GetUserNotificationsHandler.js'
import { GetUserNotificationsHandler } from './GetUserNotificationsHandler.js'

describe('GetUserNotificationsHandler', () => {
  let handler: GetUserNotificationsHandler
  let mockRepository: NotificationReadRepositoryPort

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      findByUser: vi.fn(),
      findById: vi.fn(),
      countUnread: vi.fn(),
      countByUser: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    }

    handler = new GetUserNotificationsHandler(mockRepository)
  })

  describe('execute', () => {
    it('should return notifications with unread count', async () => {
      const query: GetUserNotificationsQuery = {
        userId: 'user123',
        limit: 20,
        offset: 0,
      }

      const notifications = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user123',
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'System Update',
          body: 'You have a new announcement',
          read: false,
          createdAt: new Date('2025-01-26T12:00:00Z'),
        },
      ]

      mockRepository.findByUser = vi.fn().mockResolvedValue(notifications)
      mockRepository.countUnread = vi.fn().mockResolvedValue(1)
      mockRepository.countByUser = vi.fn().mockResolvedValue(1)

      const result = await handler.execute(query)

      expect(mockRepository.findByUser).toHaveBeenCalledWith({
        userId: 'user123',
        limit: 20,
        offset: 0,
        unreadOnly: undefined,
        types: undefined,
      })
      expect(mockRepository.countByUser).toHaveBeenCalledWith('user123', {
        unreadOnly: undefined,
        types: undefined,
      })
      expect(mockRepository.countUnread).toHaveBeenCalledWith('user123')
      expect(result).toEqual({
        notifications,
        unreadCount: 1,
        total: 1,
      })
    })

    it('should handle unread filter', async () => {
      const query: GetUserNotificationsQuery = {
        userId: 'user123',
        limit: 10,
        offset: 0,
        unreadOnly: true,
      }

      mockRepository.findByUser = vi.fn().mockResolvedValue([])
      mockRepository.countUnread = vi.fn().mockResolvedValue(0)
      mockRepository.countByUser = vi.fn().mockResolvedValue(0)

      await handler.execute(query)

      expect(mockRepository.findByUser).toHaveBeenCalledWith({
        userId: 'user123',
        limit: 10,
        offset: 0,
        unreadOnly: true,
        types: undefined,
      })
    })

    it('should handle type filter', async () => {
      const query: GetUserNotificationsQuery = {
        userId: 'user123',
        limit: 20,
        offset: 0,
        types: ['SYSTEM_ANNOUNCEMENT', 'VOUCHER_CLAIMED'],
      }

      mockRepository.findByUser = vi.fn().mockResolvedValue([])
      mockRepository.countUnread = vi.fn().mockResolvedValue(0)
      mockRepository.countByUser = vi.fn().mockResolvedValue(0)

      await handler.execute(query)

      expect(mockRepository.findByUser).toHaveBeenCalledWith({
        userId: 'user123',
        limit: 20,
        offset: 0,
        unreadOnly: undefined,
        types: ['SYSTEM_ANNOUNCEMENT', 'VOUCHER_CLAIMED'],
      })
    })

    it('should handle pagination correctly', async () => {
      const query: GetUserNotificationsQuery = {
        userId: 'user123',
        limit: 5,
        offset: 10,
      }

      mockRepository.findByUser = vi.fn().mockResolvedValue([])
      mockRepository.countUnread = vi.fn().mockResolvedValue(3)
      mockRepository.countByUser = vi.fn().mockResolvedValue(15)

      const result = await handler.execute(query)

      expect(mockRepository.findByUser).toHaveBeenCalledWith({
        userId: 'user123',
        limit: 5,
        offset: 10,
        unreadOnly: undefined,
        types: undefined,
      })
      expect(result.total).toBe(15)
      expect(result.unreadCount).toBe(3)
    })

    it('should handle empty results', async () => {
      const query: GetUserNotificationsQuery = {
        userId: 'user123',
      }

      mockRepository.findByUser = vi.fn().mockResolvedValue([])
      mockRepository.countUnread = vi.fn().mockResolvedValue(0)
      mockRepository.countByUser = vi.fn().mockResolvedValue(0)

      const result = await handler.execute(query)

      expect(result).toEqual({
        notifications: [],
        unreadCount: 0,
        total: 0,
      })
    })

    it('should handle repository errors', async () => {
      const query: GetUserNotificationsQuery = {
        userId: 'user123',
      }

      mockRepository.findByUser = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'))

      await expect(handler.execute(query)).rejects.toThrow()

      expect(mockRepository.countUnread).not.toHaveBeenCalled()
    })

    it('should validate query parameters', async () => {
      // Test missing userId
      await expect(handler.execute({} as any)).rejects.toThrow()

      // Test invalid limit values
      await expect(
        handler.execute({ userId: 'user123', limit: 0 } as any),
      ).rejects.toThrow()

      await expect(
        handler.execute({ userId: 'user123', limit: 101 } as any),
      ).rejects.toThrow()

      // Test negative offset
      await expect(
        handler.execute({ userId: 'user123', offset: -1 } as any),
      ).rejects.toThrow()
    })

    it('should use default values for optional parameters', async () => {
      const query: GetUserNotificationsQuery = {
        userId: 'user123',
      }

      mockRepository.findByUser = vi.fn().mockResolvedValue([])
      mockRepository.countUnread = vi.fn().mockResolvedValue(0)
      mockRepository.countByUser = vi.fn().mockResolvedValue(0)

      await handler.execute(query)

      expect(mockRepository.findByUser).toHaveBeenCalledWith({
        userId: 'user123',
        limit: 20,
        offset: 0,
        unreadOnly: undefined,
        types: undefined,
      })
    })
  })
})
