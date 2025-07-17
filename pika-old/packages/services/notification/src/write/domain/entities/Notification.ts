import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { v4 as uuidv4 } from 'uuid'

import { EntityRef, type EntityRefType } from '../value-objects/EntityRef.js'

export enum NotificationType {
  VOUCHER_CREATED = 'VOUCHER_CREATED',
  VOUCHER_UPDATED = 'VOUCHER_UPDATED',
  VOUCHER_EXPIRED = 'VOUCHER_EXPIRED',
  VOUCHER_CLAIMED = 'VOUCHER_CLAIMED',
  VOUCHER_REDEEMED = 'VOUCHER_REDEEMED',
  PROVIDER_UPDATED = 'PROVIDER_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

const EntityRefSchema = Type.Object({
  entityType: Type.String(),
  entityId: Type.String(),
})

export const NotificationSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  type: Type.Enum(NotificationType),
  title: Type.String({ minLength: 1, maxLength: 200 }),
  body: Type.String({ minLength: 1, maxLength: 1000 }),
  icon: Type.Optional(Type.String({ maxLength: 500 })),
  entityRef: Type.Optional(EntityRefSchema),
  read: Type.Boolean({ default: false }),
  createdAt: Type.String(),
  expiresAt: Type.Optional(Type.String()),
})

export type NotificationData = typeof NotificationSchema.static

export class Notification {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly body: string,
    public readonly icon: string | undefined,
    public readonly entityRef: EntityRef | undefined,
    public readonly read: boolean,
    public readonly createdAt: Date,
    public readonly expiresAt: Date | undefined,
  ) {}

  static create(params: {
    userId: string
    type: NotificationType
    title: string
    body: string
    icon?: string
    entityRef?: EntityRefType
    expiresAt?: Date
  }): Notification {
    const id = uuidv4()
    const createdAt = new Date()
    const entityRef = params.entityRef
      ? EntityRef.create(params.entityRef)
      : undefined

    // Basic business rule validation (following DDD pattern)
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Notification title cannot be empty')
    }
    if (!params.body || params.body.trim().length === 0) {
      throw new Error('Notification body cannot be empty')
    }

    return new Notification(
      id,
      params.userId,
      params.type,
      params.title,
      params.body,
      params.icon,
      entityRef,
      false,
      createdAt,
      params.expiresAt,
    )
  }

  static fromPersistence(data: NotificationData): Notification {
    if (!Value.Check(NotificationSchema, data)) {
      throw new Error('Invalid notification data from persistence')
    }

    const entityRef = data.entityRef
      ? EntityRef.create(data.entityRef)
      : undefined

    return new Notification(
      data.id,
      data.userId,
      data.type as NotificationType,
      data.title,
      data.body,
      data.icon,
      entityRef,
      data.read,
      new Date(data.createdAt),
      data.expiresAt ? new Date(data.expiresAt) : undefined,
    )
  }

  markAsRead(): Notification {
    return new Notification(
      this.id,
      this.userId,
      this.type,
      this.title,
      this.body,
      this.icon,
      this.entityRef,
      true,
      this.createdAt,
      this.expiresAt,
    )
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false

    return new Date() > this.expiresAt
  }

  toPersistence(): NotificationData {
    const data: NotificationData = {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      body: this.body,
      read: this.read,
      createdAt: this.createdAt.toISOString(),
    }

    // Only include optional fields if they have values
    if (this.icon !== undefined) {
      data.icon = this.icon
    }

    if (this.entityRef !== undefined) {
      data.entityRef = {
        entityType: this.entityRef.entityType,
        entityId: this.entityRef.entityId,
      }
    }

    if (this.expiresAt !== undefined) {
      data.expiresAt = this.expiresAt.toISOString()
    }

    return data
  }
}
