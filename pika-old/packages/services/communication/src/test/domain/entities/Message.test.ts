import {
  MessageStatus,
  MessageType,
} from '@communication-shared/types/index.js'
import { Message } from '@communication-write/domain/entities/Message.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Message', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-26T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('create', () => {
    it('should create a text message with required fields', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      expect(message.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
      expect(message.conversationId).toBe('conv-123')
      expect(message.senderId).toBe('user-123')
      expect(message.senderType).toBe('CUSTOMER')
      expect(message.type).toBe(MessageType.TEXT)
      expect(message.content).toBe('Hello, world!')
      expect(message.metadata).toBeNull()
      expect(message.status.sent).toEqual(new Date('2025-01-26T12:00:00Z'))
      expect(message.status.delivered).toBeUndefined()
      expect(message.status.read).toBeUndefined()
      expect(message.replyTo).toBeNull()
      expect(message.editHistory).toEqual([])
      expect(message.deletedAt).toBeNull()
      expect(message.createdAt).toEqual(new Date('2025-01-26T12:00:00Z'))
      expect(message.updatedAt).toEqual(new Date('2025-01-26T12:00:00Z'))
    })

    it('should create an image message with metadata', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.IMAGE,
        content: 'Check out this image!',
        metadata: {
          fileUrl: 'https://example.com/image.jpg',
          fileName: 'image.jpg',
          fileSize: 1024,
        },
      })

      expect(message.type).toBe(MessageType.IMAGE)
      expect(message.metadata?.fileUrl).toBe('https://example.com/image.jpg')
      expect(message.metadata?.fileName).toBe('image.jpg')
      expect(message.metadata?.fileSize).toBe(1024)
    })

    it('should create a reply message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'This is a reply',
        replyToId: 'msg-456',
        replyToContent: 'Original message',
        replyToSenderId: 'user-456',
      })

      expect(message.replyTo).toEqual({
        messageId: 'msg-456',
        content: 'Original message',
        senderId: 'user-456',
      })
    })

    it('should throw error for empty text message content', () => {
      expect(() =>
        Message.create({
          conversationId: 'conv-123',
          senderId: 'user-123',
          senderType: 'CUSTOMER',
          type: MessageType.TEXT,
          content: '',
        }),
      ).toThrow('Validation error')
    })

    it('should throw error for image message without file URL', () => {
      expect(() =>
        Message.create({
          conversationId: 'conv-123',
          senderId: 'user-123',
          senderType: 'CUSTOMER',
          type: MessageType.IMAGE,
          content: 'Image message',
        }),
      ).toThrow('Validation error')
    })

    it('should throw error for file message without file URL', () => {
      expect(() =>
        Message.create({
          conversationId: 'conv-123',
          senderId: 'user-123',
          senderType: 'CUSTOMER',
          type: MessageType.FILE,
          content: 'File message',
        }),
      ).toThrow('Validation error')
    })
  })

  describe('markAsDelivered', () => {
    it('should mark message as delivered', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      const deliveredMessage = message.markAsDelivered()

      expect(deliveredMessage).not.toBe(message)
      expect(deliveredMessage.status.delivered).toEqual(
        new Date('2025-01-26T12:00:00Z'),
      )
      expect(deliveredMessage.status.sent).toEqual(message.status.sent)
      expect(deliveredMessage.status.read).toBeUndefined()
    })

    it('should not change already delivered message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      const deliveredMessage = message.markAsDelivered()
      const secondDeliveredMessage = deliveredMessage.markAsDelivered()

      expect(secondDeliveredMessage).toBe(deliveredMessage)
    })
  })

  describe('markAsRead', () => {
    it('should mark message as read and delivered', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      const readMessage = message.markAsRead()

      expect(readMessage).not.toBe(message)
      expect(readMessage.status.read).toEqual(new Date('2025-01-26T12:00:00Z'))
      expect(readMessage.status.delivered).toEqual(
        new Date('2025-01-26T12:00:00Z'),
      )
      expect(readMessage.status.sent).toEqual(message.status.sent)
    })

    it('should not change already read message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      const readMessage = message.markAsRead()
      const secondReadMessage = readMessage.markAsRead()

      expect(secondReadMessage).toBe(readMessage)
    })
  })

  describe('edit', () => {
    it('should edit message content', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Original content',
      })

      const editedMessage = message.edit('Edited content', 'user-123')

      expect(editedMessage).not.toBe(message)
      expect(editedMessage.content).toBe('Edited content')
      expect(editedMessage.editHistory).toHaveLength(1)
      expect(editedMessage.editHistory[0].content).toBe('Original content')
      expect(editedMessage.editHistory[0].editedAt).toEqual(
        new Date('2025-01-26T12:00:00Z'),
      )
    })

    it('should throw error if editor is not the sender', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Original content',
      })

      expect(() => message.edit('Edited content', 'user-456')).toThrow(
        'Validation error',
      )
    })

    it('should throw error for non-text messages', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.IMAGE,
        content: 'Image message',
        metadata: { fileUrl: 'https://example.com/image.jpg' },
      })

      expect(() => message.edit('Edited content', 'user-123')).toThrow(
        'Validation error',
      )
    })

    it('should throw error for deleted messages', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Original content',
      })

      const deletedMessage = message.delete('user-123')

      expect(() => deletedMessage.edit('Edited content', 'user-123')).toThrow(
        'Validation error',
      )
    })
  })

  describe('delete', () => {
    it('should mark message as deleted', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Original content',
      })

      const deletedMessage = message.delete('user-123')

      expect(deletedMessage).not.toBe(message)
      expect(deletedMessage.deletedAt).toEqual(new Date('2025-01-26T12:00:00Z'))
    })

    it('should throw error if deleter is not the sender', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Original content',
      })

      expect(() => message.delete('user-456')).toThrow('Validation error')
    })
  })

  describe('getCurrentStatus', () => {
    it('should return SENT for new message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      expect(message.getCurrentStatus()).toBe(MessageStatus.SENT)
    })

    it('should return DELIVERED for delivered message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      const deliveredMessage = message.markAsDelivered()

      expect(deliveredMessage.getCurrentStatus()).toBe(MessageStatus.DELIVERED)
    })

    it('should return READ for read message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      const readMessage = message.markAsRead()

      expect(readMessage.getCurrentStatus()).toBe(MessageStatus.READ)
    })
  })

  describe('isEdited', () => {
    it('should return false for new message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      expect(message.isEdited()).toBe(false)
    })

    it('should return true for edited message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Original content',
      })

      const editedMessage = message.edit('Edited content', 'user-123')

      expect(editedMessage.isEdited()).toBe(true)
    })
  })

  describe('isDeleted', () => {
    it('should return false for new message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello, world!',
      })

      expect(message.isDeleted()).toBe(false)
    })

    it('should return true for deleted message', () => {
      const message = Message.create({
        conversationId: 'conv-123',
        senderId: 'user-123',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Original content',
      })

      const deletedMessage = message.delete('user-123')

      expect(deletedMessage.isDeleted()).toBe(true)
    })
  })
})
