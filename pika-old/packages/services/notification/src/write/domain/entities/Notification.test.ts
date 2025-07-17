import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Notification, NotificationType } from './Notification.js'

describe('Notification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-26T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('create', () => {
    it('should create a notification with required fields', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
      })

      expect(notification.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
      expect(notification.userId).toBe('123e4567-e89b-12d3-a456-426614174001')
      expect(notification.type).toBe(NotificationType.VOUCHER_CLAIMED)
      expect(notification.title).toBe('Voucher Claimed')
      expect(notification.body).toBe('You have claimed a new voucher')
      expect(notification.read).toBe(false)
      expect(notification.createdAt).toEqual(new Date('2025-01-26T12:00:00Z'))
      expect(notification.icon).toBeUndefined()
      expect(notification.entityRef).toBeUndefined()
      expect(notification.expiresAt).toBeUndefined()
    })

    it('should create a notification with all optional fields', () => {
      const expiresAt = new Date('2025-02-26T12:00:00Z')
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        icon: 'voucher-icon.png',
        entityRef: {
          entityType: 'voucher',
          entityId: '123e4567-e89b-12d3-a456-426614174002',
        },
        expiresAt,
      })

      expect(notification.icon).toBe('voucher-icon.png')
      expect(notification.entityRef).toBeDefined()
      expect(notification.entityRef?.entityType).toBe('voucher')
      expect(notification.entityRef?.entityId).toBe(
        '123e4567-e89b-12d3-a456-426614174002',
      )
      expect(notification.expiresAt).toEqual(expiresAt)
    })

    it('should throw error if title is empty', () => {
      expect(() =>
        Notification.create({
          userId: '123e4567-e89b-12d3-a456-426614174001',
          type: NotificationType.VOUCHER_CLAIMED,
          title: '',
          body: 'You have claimed a new voucher',
        }),
      ).toThrow('Notification title cannot be empty')
    })

    it('should throw error if title is only whitespace', () => {
      expect(() =>
        Notification.create({
          userId: '123e4567-e89b-12d3-a456-426614174001',
          type: NotificationType.VOUCHER_CLAIMED,
          title: '   ',
          body: 'You have claimed a new voucher',
        }),
      ).toThrow('Notification title cannot be empty')
    })

    it('should throw error if body is empty', () => {
      expect(() =>
        Notification.create({
          userId: '123e4567-e89b-12d3-a456-426614174001',
          type: NotificationType.VOUCHER_CLAIMED,
          title: 'Voucher Claimed',
          body: '',
        }),
      ).toThrow('Notification body cannot be empty')
    })

    it('should throw error if body is only whitespace', () => {
      expect(() =>
        Notification.create({
          userId: '123e4567-e89b-12d3-a456-426614174001',
          type: NotificationType.VOUCHER_CLAIMED,
          title: 'Voucher Claimed',
          body: '   ',
        }),
      ).toThrow('Notification body cannot be empty')
    })
  })

  describe('fromPersistence', () => {
    it('should create notification from valid persistence data', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'VOUCHER_CLAIMED' as NotificationType,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        read: false,
        createdAt: '2025-01-26T12:00:00.000Z',
      }

      const notification = Notification.fromPersistence(data)

      expect(notification.id).toBe(data.id)
      expect(notification.userId).toBe(data.userId)
      expect(notification.type).toBe(data.type)
      expect(notification.title).toBe(data.title)
      expect(notification.body).toBe(data.body)
      expect(notification.read).toBe(data.read)
      expect(notification.createdAt).toEqual(new Date(data.createdAt))
    })

    it('should create notification with optional fields from persistence', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'VOUCHER_CLAIMED' as NotificationType,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        icon: 'voucher-icon.png',
        entityRef: {
          entityType: 'voucher',
          entityId: '123e4567-e89b-12d3-a456-426614174002',
        },
        read: true,
        createdAt: '2025-01-26T12:00:00.000Z',
        expiresAt: '2025-02-26T12:00:00.000Z',
      }

      const notification = Notification.fromPersistence(data)

      expect(notification.icon).toBe(data.icon)
      expect(notification.entityRef?.entityType).toBe(data.entityRef.entityType)
      expect(notification.entityRef?.entityId).toBe(data.entityRef.entityId)
      expect(notification.read).toBe(true)
      expect(notification.expiresAt).toEqual(new Date(data.expiresAt))
    })

    it('should throw error for invalid persistence data', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'INVALID_TYPE', // Invalid enum value
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        read: false,
        createdAt: '2025-01-26T12:00:00.000Z',
      }

      expect(() => Notification.fromPersistence(invalidData as any)).toThrow(
        'Invalid notification data from persistence',
      )
    })
  })

  describe('markAsRead', () => {
    it('should create a new notification instance marked as read', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
      })

      const readNotification = notification.markAsRead()

      expect(readNotification).not.toBe(notification)
      expect(readNotification.read).toBe(true)
      expect(readNotification.id).toBe(notification.id)
      expect(readNotification.userId).toBe(notification.userId)
      expect(readNotification.type).toBe(notification.type)
      expect(readNotification.title).toBe(notification.title)
      expect(readNotification.body).toBe(notification.body)
      expect(readNotification.createdAt).toEqual(notification.createdAt)
    })
  })

  describe('isExpired', () => {
    it('should return false if no expiration date', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
      })

      expect(notification.isExpired()).toBe(false)
    })

    it('should return false if expiration date is in the future', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        expiresAt: new Date('2025-02-26T12:00:00Z'),
      })

      expect(notification.isExpired()).toBe(false)
    })

    it('should return true if expiration date is in the past', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        expiresAt: new Date('2025-01-25T12:00:00Z'),
      })

      expect(notification.isExpired()).toBe(true)
    })
  })

  describe('toPersistence', () => {
    it('should convert notification to persistence format', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
      })

      const data = notification.toPersistence()

      expect(data).toEqual({
        id: notification.id,
        userId: notification.userId,
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        icon: undefined,
        entityRef: undefined,
        read: false,
        createdAt: '2025-01-26T12:00:00.000Z',
        expiresAt: undefined,
      })
    })

    it('should include all optional fields in persistence format', () => {
      const expiresAt = new Date('2025-02-26T12:00:00Z')
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        icon: 'voucher-icon.png',
        entityRef: {
          entityType: 'voucher',
          entityId: '123e4567-e89b-12d3-a456-426614174002',
        },
        expiresAt,
      })

      const data = notification.toPersistence()

      expect(data).toEqual({
        id: notification.id,
        userId: notification.userId,
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        icon: 'voucher-icon.png',
        entityRef: {
          entityType: 'voucher',
          entityId: '123e4567-e89b-12d3-a456-426614174002',
        },
        read: false,
        createdAt: '2025-01-26T12:00:00.000Z',
        expiresAt: '2025-02-26T12:00:00.000Z',
      })
    })
  })

  describe('NotificationType enum', () => {
    it('should have all expected notification types', () => {
      expect(NotificationType.PAYMENT_RECEIVED).toBe('PAYMENT_RECEIVED')
      expect(NotificationType.PAYMENT_FAILED).toBe('PAYMENT_FAILED')
      expect(NotificationType.MESSAGE_RECEIVED).toBe('MESSAGE_RECEIVED')
      expect(NotificationType.REVIEW_RECEIVED).toBe('REVIEW_RECEIVED')
      expect(NotificationType.VOUCHER_CLAIMED).toBe('VOUCHER_CLAIMED')
      expect(NotificationType.VOUCHER_REDEEMED).toBe('VOUCHER_REDEEMED')
      expect(NotificationType.VOUCHER_EXPIRED).toBe('VOUCHER_EXPIRED')
      expect(NotificationType.SYSTEM_ANNOUNCEMENT).toBe('SYSTEM_ANNOUNCEMENT')
    })
  })
})
