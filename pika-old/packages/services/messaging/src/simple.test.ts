import { describe, expect, it } from 'vitest'

import { ConversationContext, MessageType } from './shared/types.js'
import { Conversation } from './write/domain/entities/Conversation.js'
import { Message } from './write/domain/entities/Message.js'

describe('Messaging Domain Entities', () => {
  describe('Conversation', () => {
    it('should create a valid conversation', () => {
      const conversation = Conversation.create({
        id: 'conv-123',
        participantIds: ['user-1', 'user-2'],
        context: {
          type: ConversationContext.GENERAL,
          id: 'ctx-123',
        },
      })

      expect(conversation.id).toBe('conv-123')
      expect(conversation.participants.size).toBe(2)
      expect(conversation.isParticipant('user-1')).toBe(true)
      expect(conversation.isParticipant('user-2')).toBe(true)
      expect(conversation.isParticipant('user-3')).toBe(false)
    })

    it('should not allow conversation with self', () => {
      expect(() => {
        Conversation.create({
          id: 'conv-123',
          participantIds: ['user-1', 'user-1'],
        })
      }).toThrow('Duplicate participants are not allowed')
    })

    it('should require at least 2 participants', () => {
      expect(() => {
        Conversation.create({
          id: 'conv-123',
          participantIds: ['user-1'],
        })
      }).toThrow('A conversation must have at least 2 participants')
    })

    it('should update last message', () => {
      const conversation = Conversation.create({
        id: 'conv-123',
        participantIds: ['user-1', 'user-2'],
      })

      expect(conversation.lastMessage).toBeNull()

      conversation.updateLastMessage({
        id: 'msg-1',
        content: 'Hello',
        senderId: 'user-1',
        type: MessageType.TEXT,
      })

      expect(conversation.lastMessage).toBeTruthy()
      expect(conversation.lastMessage?.content).toBe('Hello')
      expect(conversation.participants.get('user-2')?.unreadCount).toBe(1)
    })

    it('should mark messages as read', () => {
      const conversation = Conversation.create({
        id: 'conv-123',
        participantIds: ['user-1', 'user-2'],
      })

      conversation.updateLastMessage({
        id: 'msg-1',
        content: 'Hello',
        senderId: 'user-1',
        type: MessageType.TEXT,
      })

      expect(conversation.participants.get('user-2')?.unreadCount).toBe(1)

      conversation.markAsRead('user-2', 'msg-1')

      expect(conversation.participants.get('user-2')?.unreadCount).toBe(0)
      expect(conversation.participants.get('user-2')?.lastReadMessageId).toBe(
        'msg-1',
      )
    })
  })

  describe('Message', () => {
    it('should create a valid text message', () => {
      const message = Message.create({
        id: 'msg-123',
        conversationId: 'conv-123',
        senderId: 'user-1',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello world',
      })

      expect(message.id).toBe('msg-123')
      expect(message.content).toBe('Hello world')
      expect(message.type).toBe(MessageType.TEXT)
      expect(message.getCurrentStatus()).toBe('SENT')
    })

    it('should not allow empty text messages', () => {
      expect(() => {
        Message.create({
          id: 'msg-123',
          conversationId: 'conv-123',
          senderId: 'user-1',
          senderType: 'CUSTOMER',
          type: MessageType.TEXT,
          content: '   ',
        })
      }).toThrow('Text message content cannot be empty')
    })

    it('should require file URL for image messages', () => {
      expect(() => {
        Message.create({
          id: 'msg-123',
          conversationId: 'conv-123',
          senderId: 'user-1',
          senderType: 'CUSTOMER',
          type: MessageType.IMAGE,
          content: 'image.jpg',
        })
      }).toThrow('Image message must have a file URL in metadata')
    })

    it('should mark message as delivered', () => {
      const message = Message.create({
        id: 'msg-123',
        conversationId: 'conv-123',
        senderId: 'user-1',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello',
      })

      expect(message.status.delivered).toBeUndefined()

      message.markAsDelivered()

      expect(message.status.delivered).toBeDefined()
      expect(message.getCurrentStatus()).toBe('DELIVERED')
    })

    it('should mark message as read', () => {
      const message = Message.create({
        id: 'msg-123',
        conversationId: 'conv-123',
        senderId: 'user-1',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello',
      })

      message.markAsRead()

      expect(message.status.read).toBeDefined()
      expect(message.status.delivered).toBeDefined() // Should also be marked as delivered
      expect(message.getCurrentStatus()).toBe('READ')
    })

    it('should allow editing text messages', () => {
      const message = Message.create({
        id: 'msg-123',
        conversationId: 'conv-123',
        senderId: 'user-1',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello',
      })

      message.edit('Hello world', 'user-1')

      expect(message.content).toBe('Hello world')
      expect(message.isEdited()).toBe(true)
      expect(message.editHistory).toHaveLength(1)
      expect(message.editHistory[0].content).toBe('Hello')
    })

    it('should only allow sender to edit their message', () => {
      const message = Message.create({
        id: 'msg-123',
        conversationId: 'conv-123',
        senderId: 'user-1',
        senderType: 'CUSTOMER',
        type: MessageType.TEXT,
        content: 'Hello',
      })

      expect(() => {
        message.edit('Hello world', 'user-2')
      }).toThrow('Only the sender can edit their message')
    })

    it('should handle reply messages', () => {
      const message = Message.create({
        id: 'msg-123',
        conversationId: 'conv-123',
        senderId: 'user-2',
        senderType: 'PROVIDER',
        type: MessageType.TEXT,
        content: 'This is a reply',
        replyToId: 'msg-122',
        replyToContent: 'Original message',
        replyToSenderId: 'user-1',
      })

      expect(message.replyTo).toBeTruthy()
      expect(message.replyTo?.messageId).toBe('msg-122')
      expect(message.replyTo?.content).toBe('Original message')
      expect(message.replyTo?.senderId).toBe('user-1')
    })
  })
})
