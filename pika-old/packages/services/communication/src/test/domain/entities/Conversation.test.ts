import { ConversationType } from '@communication-shared/types/index.js'
import { Conversation } from '@communication-write/domain/entities/Conversation.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Conversation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-26T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('create', () => {
    it('should create a conversation with required fields', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
        metadata: {
          providerId: 'provider-123',
          customerId: 'user-123',
        },
      })

      expect(conversation.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
      expect(conversation.participantIds).toEqual(['user-123', 'user-456'])
      expect(conversation.type).toBe(ConversationType.CUSTOMER_PROVIDER)
      expect(conversation.metadata?.providerId).toBe('provider-123')
      expect(conversation.metadata?.customerId).toBe('user-123')
      expect(conversation.lastMessage).toBeNull()
      expect(conversation.lastMessageAt).toBeNull()
      expect(conversation.createdAt).toEqual(new Date('2025-01-26T12:00:00Z'))
      expect(conversation.updatedAt).toEqual(new Date('2025-01-26T12:00:00Z'))
    })

    it('should create a group conversation', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456', 'user-789'],
        type: ConversationType.GROUP,
        title: 'Group Chat',
      })

      expect(conversation.participantIds).toEqual([
        'user-123',
        'user-456',
        'user-789',
      ])
      expect(conversation.type).toBe(ConversationType.GROUP)
      expect(conversation.title).toBe('Group Chat')
    })

    it('should throw error for empty participant list', () => {
      expect(() =>
        Conversation.create({
          participantIds: [],
          type: ConversationType.CUSTOMER_PROVIDER,
        }),
      ).toThrow('Validation error')
    })

    it('should throw error for single participant in non-group conversation', () => {
      expect(() =>
        Conversation.create({
          participantIds: ['user-123'],
          type: ConversationType.CUSTOMER_PROVIDER,
        }),
      ).toThrow('Validation error')
    })

    it('should throw error for more than 2 participants in customer-provider conversation', () => {
      expect(() =>
        Conversation.create({
          participantIds: ['user-123', 'user-456', 'user-789'],
          type: ConversationType.CUSTOMER_PROVIDER,
        }),
      ).toThrow('Validation error')
    })
  })

  describe('updateLastMessage', () => {
    it('should update last message info', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      vi.setSystemTime(new Date('2025-01-26T12:30:00Z'))

      const updatedConversation = conversation.updateLastMessage(
        'msg-123',
        'Hello there!',
        'user-123',
      )

      expect(updatedConversation).not.toBe(conversation)
      expect(updatedConversation.lastMessage).toEqual({
        messageId: 'msg-123',
        content: 'Hello there!',
        senderId: 'user-123',
      })
      expect(updatedConversation.lastMessageAt).toEqual(
        new Date('2025-01-26T12:30:00Z'),
      )
      expect(updatedConversation.updatedAt).toEqual(
        new Date('2025-01-26T12:30:00Z'),
      )
    })
  })

  describe('addParticipant', () => {
    it('should add participant to group conversation', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.GROUP,
        title: 'Group Chat',
      })

      const updatedConversation = conversation.addParticipant('user-789')

      expect(updatedConversation).not.toBe(conversation)
      expect(updatedConversation.participantIds).toEqual([
        'user-123',
        'user-456',
        'user-789',
      ])
      expect(updatedConversation.updatedAt).toEqual(
        new Date('2025-01-26T12:00:00Z'),
      )
    })

    it('should not add duplicate participant', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.GROUP,
        title: 'Group Chat',
      })

      const updatedConversation = conversation.addParticipant('user-123')

      expect(updatedConversation).toBe(conversation)
      expect(updatedConversation.participantIds).toEqual([
        'user-123',
        'user-456',
      ])
    })

    it('should throw error for non-group conversation', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      expect(() => conversation.addParticipant('user-789')).toThrow(
        'Validation error',
      )
    })
  })

  describe('removeParticipant', () => {
    it('should remove participant from group conversation', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456', 'user-789'],
        type: ConversationType.GROUP,
        title: 'Group Chat',
      })

      const updatedConversation = conversation.removeParticipant('user-456')

      expect(updatedConversation).not.toBe(conversation)
      expect(updatedConversation.participantIds).toEqual([
        'user-123',
        'user-789',
      ])
      expect(updatedConversation.updatedAt).toEqual(
        new Date('2025-01-26T12:00:00Z'),
      )
    })

    it('should not remove non-existent participant', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.GROUP,
        title: 'Group Chat',
      })

      const updatedConversation = conversation.removeParticipant('user-789')

      expect(updatedConversation).toBe(conversation)
      expect(updatedConversation.participantIds).toEqual([
        'user-123',
        'user-456',
      ])
    })

    it('should throw error for non-group conversation', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      expect(() => conversation.removeParticipant('user-123')).toThrow(
        'Validation error',
      )
    })

    it('should throw error when removing last participant', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123'],
        type: ConversationType.GROUP,
        title: 'Group Chat',
      })

      expect(() => conversation.removeParticipant('user-123')).toThrow(
        'Validation error',
      )
    })
  })

  describe('muteForUser', () => {
    it('should mute conversation for user', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      const mutedConversation = conversation.muteForUser('user-123')

      expect(mutedConversation).not.toBe(conversation)
      expect(mutedConversation.mutedBy).toEqual(['user-123'])
      expect(mutedConversation.updatedAt).toEqual(
        new Date('2025-01-26T12:00:00Z'),
      )
    })

    it('should not duplicate muted user', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      const mutedOnce = conversation.muteForUser('user-123')
      const mutedTwice = mutedOnce.muteForUser('user-123')

      expect(mutedTwice).toBe(mutedOnce)
      expect(mutedTwice.mutedBy).toEqual(['user-123'])
    })
  })

  describe('unmuteForUser', () => {
    it('should unmute conversation for user', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      const mutedConversation = conversation.muteForUser('user-123')
      const unmutedConversation = mutedConversation.unmuteForUser('user-123')

      expect(unmutedConversation).not.toBe(mutedConversation)
      expect(unmutedConversation.mutedBy).toEqual([])
      expect(unmutedConversation.updatedAt).toEqual(
        new Date('2025-01-26T12:00:00Z'),
      )
    })

    it('should not change if user was not muted', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      const unmutedConversation = conversation.unmuteForUser('user-123')

      expect(unmutedConversation).toBe(conversation)
      expect(unmutedConversation.mutedBy).toEqual([])
    })
  })

  describe('isParticipant', () => {
    it('should return true for participant', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      expect(conversation.isParticipant('user-123')).toBe(true)
      expect(conversation.isParticipant('user-456')).toBe(true)
    })

    it('should return false for non-participant', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      expect(conversation.isParticipant('user-789')).toBe(false)
    })
  })

  describe('isMutedForUser', () => {
    it('should return true for muted user', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      const mutedConversation = conversation.muteForUser('user-123')

      expect(mutedConversation.isMutedForUser('user-123')).toBe(true)
      expect(mutedConversation.isMutedForUser('user-456')).toBe(false)
    })

    it('should return false for non-muted user', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      expect(conversation.isMutedForUser('user-123')).toBe(false)
      expect(conversation.isMutedForUser('user-456')).toBe(false)
    })
  })

  describe('getOtherParticipantId', () => {
    it('should return other participant in customer-provider conversation', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      expect(conversation.getOtherParticipantId('user-123')).toBe('user-456')
      expect(conversation.getOtherParticipantId('user-456')).toBe('user-123')
    })

    it('should throw error for non-participant', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456'],
        type: ConversationType.CUSTOMER_PROVIDER,
      })

      expect(() => conversation.getOtherParticipantId('user-789')).toThrow(
        'Validation error',
      )
    })

    it('should throw error for group conversation', () => {
      const conversation = Conversation.create({
        participantIds: ['user-123', 'user-456', 'user-789'],
        type: ConversationType.GROUP,
        title: 'Group Chat',
      })

      expect(() => conversation.getOtherParticipantId('user-123')).toThrow(
        'Validation error',
      )
    })
  })
})
