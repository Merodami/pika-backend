import { NotificationType } from '@communication-shared/types/index.js'
import { Notification } from '@communication-write/domain/entities/Notification.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
      expect(notification.title).toEqual({
        en: 'Voucher Claimed',
        es: 'Voucher Claimed',
        gn: 'Voucher Claimed',
        pt: 'Voucher Claimed',
      })
      expect(notification.body).toEqual({
        en: 'You have claimed a new voucher',
        es: 'You have claimed a new voucher',
        gn: 'You have claimed a new voucher',
        pt: 'You have claimed a new voucher',
      })
      expect(notification.read).toBe(false)
      expect(notification.createdAt).toEqual(new Date('2025-01-26T12:00:00Z'))
      expect(notification.icon).toBeUndefined()
      expect(notification.entityRef).toBeUndefined()
      expect(notification.expiresAt).toBeUndefined()
    })

    it('should create a notification with multilingual text', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.MESSAGE_RECEIVED,
        title: {
          en: 'New Message',
          es: 'Nuevo Mensaje',
          gn: "Ñe'ẽ Pyahu",
          pt: 'Nova Mensagem',
        },
        body: {
          en: 'You have received a new message',
          es: 'Has recibido un nuevo mensaje',
          gn: "Ereko ñe'ẽ pyahu",
          pt: 'Você recebeu uma nova mensagem',
        },
      })

      expect(notification.title).toEqual({
        en: 'New Message',
        es: 'Nuevo Mensaje',
        gn: "Ñe'ẽ Pyahu",
        pt: 'Nova Mensagem',
      })
      expect(notification.body).toEqual({
        en: 'You have received a new message',
        es: 'Has recibido un nuevo mensaje',
        gn: "Ereko ñe'ẽ pyahu",
        pt: 'Você recebeu uma nova mensagem',
      })
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
      ).toThrow('Validation error')
    })

    it('should throw error if body is empty', () => {
      expect(() =>
        Notification.create({
          userId: '123e4567-e89b-12d3-a456-426614174001',
          type: NotificationType.VOUCHER_CLAIMED,
          title: 'Voucher Claimed',
          body: '',
        }),
      ).toThrow('Validation error')
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
      expect(readNotification.title).toEqual(notification.title)
      expect(readNotification.body).toEqual(notification.body)
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
      // Create notification with future expiration
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.VOUCHER_CLAIMED,
        title: 'Voucher Claimed',
        body: 'You have claimed a new voucher',
        expiresAt: new Date('2025-01-26T13:00:00Z'), // 1 hour in the future
      })

      // Advance time to after expiration
      vi.setSystemTime(new Date('2025-01-26T14:00:00Z'))

      expect(notification.isExpired()).toBe(true)
    })
  })

  describe('getLocalizedTitle', () => {
    it('should return title in requested language', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.MESSAGE_RECEIVED,
        title: {
          en: 'New Message',
          es: 'Nuevo Mensaje',
          gn: "Ñe'ẽ Pyahu",
          pt: 'Nova Mensagem',
        },
        body: 'You have received a new message',
      })

      expect(notification.getLocalizedTitle('en')).toBe('New Message')
      expect(notification.getLocalizedTitle('es')).toBe('Nuevo Mensaje')
      expect(notification.getLocalizedTitle('gn')).toBe("Ñe'ẽ Pyahu")
      expect(notification.getLocalizedTitle('pt')).toBe('Nova Mensagem')
    })

    it('should fallback to English for unknown language', () => {
      const notification = Notification.create({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        type: NotificationType.MESSAGE_RECEIVED,
        title: {
          en: 'New Message',
          es: 'Nuevo Mensaje',
          gn: '',
          pt: '',
        },
        body: 'You have received a new message',
      })

      expect(notification.getLocalizedTitle('fr')).toBe('New Message')
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
      expect(NotificationType.VOUCHER_CREATED).toBe('VOUCHER_CREATED')
      expect(NotificationType.VOUCHER_UPDATED).toBe('VOUCHER_UPDATED')
      expect(NotificationType.PROVIDER_UPDATED).toBe('PROVIDER_UPDATED')
      expect(NotificationType.SYSTEM_ANNOUNCEMENT).toBe('SYSTEM_ANNOUNCEMENT')
    })
  })
})
