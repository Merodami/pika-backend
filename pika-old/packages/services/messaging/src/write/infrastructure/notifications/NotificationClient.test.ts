import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationClient } from './NotificationClient.js'

// Mock fetch globally
const mockFetch = vi.fn()

global.fetch = mockFetch

describe('NotificationClient', () => {
  let notificationClient: NotificationClient

  beforeEach(() => {
    notificationClient = new NotificationClient('http://localhost:4004/api/v1')
    vi.clearAllMocks()
  })

  describe('notifyNewMessage', () => {
    it('should send notification via HTTP with correct payload', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const params = {
        recipientId: 'user-123',
        senderId: 'user-456',
        conversationId: 'conv-789',
        messageId: 'msg-abc',
        content: 'Hello world',
      }

      // Act
      await notificationClient.notifyNewMessage(params)

      // Assert
      expect(mockFetch).toHaveBeenCalledOnce()
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4004/api/v1/notifications/publish',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'user-123',
            type: 'MESSAGE_RECEIVED',
            title: 'New Message',
            body: 'Hello world',
            entityRef: {
              entityType: 'message',
              entityId: 'msg-abc',
            },
          }),
        },
      )
    })

    it('should handle HTTP errors gracefully without throwing', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Service unavailable' }),
      })

      const params = {
        recipientId: 'user-123',
        senderId: 'user-456',
        conversationId: 'conv-789',
        messageId: 'msg-abc',
        content: 'Hello world',
      }

      // Act & Assert - should not throw
      await expect(
        notificationClient.notifyNewMessage(params),
      ).resolves.toBeUndefined()
    })

    it('should handle network errors gracefully without throwing', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const params = {
        recipientId: 'user-123',
        senderId: 'user-456',
        conversationId: 'conv-789',
        messageId: 'msg-abc',
        content: 'Hello world',
      }

      // Act & Assert - should not throw
      await expect(
        notificationClient.notifyNewMessage(params),
      ).resolves.toBeUndefined()
    })

    it('should use default URL when none provided', () => {
      // Arrange & Act
      const client = new NotificationClient()

      // Assert
      expect(client['notificationServiceUrl']).toBe(
        'http://localhost:5023/api/v1',
      )
    })

    it('should use custom URL when provided', () => {
      // Arrange & Act
      const client = new NotificationClient('http://custom:8080/api/v1')

      // Assert
      expect(client['notificationServiceUrl']).toBe('http://custom:8080/api/v1')
    })
  })
})
