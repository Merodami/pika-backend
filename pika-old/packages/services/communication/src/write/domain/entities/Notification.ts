import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'
import { ErrorFactory } from '@pika/shared'
import { MultilingualText } from '@pika/types-core'
import { get } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'

interface NotificationData {
  id: string
  userId: string
  type: NotificationType
  title: MultilingualText
  body: MultilingualText
  icon?: string
  entityRef?: EntityReference
  read: boolean
  createdAt: Date
  expiresAt?: Date
}

export class Notification {
  private constructor(private readonly data: NotificationData) {
    this.validateInvariants()
  }

  private validateInvariants(): void {
    // Validate multilingual text
    if (!this.hasValidMultilingualText(this.data.title)) {
      throw ErrorFactory.validationError(
        { title: ['Notification title must have at least one language'] },
        { source: 'Notification.validateInvariants' },
      )
    }

    if (!this.hasValidMultilingualText(this.data.body)) {
      throw ErrorFactory.validationError(
        { body: ['Notification body must have at least one language'] },
        { source: 'Notification.validateInvariants' },
      )
    }

    // Validate expiration
    if (this.data.expiresAt && this.data.expiresAt < this.data.createdAt) {
      throw ErrorFactory.validationError(
        { expiresAt: ['Expiration date cannot be before creation date'] },
        { source: 'Notification.validateInvariants' },
      )
    }
  }

  private hasValidMultilingualText(text: MultilingualText): boolean {
    return (
      text &&
      !!(text.en || text.es || text.gn || text.pt) &&
      Object.values(text).some(
        (value) =>
          value && typeof value === 'string' && value.trim().length > 0,
      )
    )
  }

  static create(params: {
    userId: string
    type: NotificationType
    title: MultilingualText | string
    body: MultilingualText | string
    icon?: string
    entityRef?: EntityReference
    expiresAt?: Date
  }): Notification {
    const id = uuidv4()
    const createdAt = new Date()

    // Convert string to multilingual text if needed
    const title =
      typeof params.title === 'string'
        ? {
            en: params.title,
            es: params.title,
            gn: params.title,
            pt: params.title,
          }
        : params.title

    const body =
      typeof params.body === 'string'
        ? { en: params.body, es: params.body, gn: params.body, pt: params.body }
        : params.body

    return new Notification({
      id,
      userId: params.userId,
      type: params.type,
      title,
      body,
      icon: params.icon,
      entityRef: params.entityRef,
      read: false,
      createdAt,
      expiresAt: params.expiresAt,
    })
  }

  static reconstitute(data: NotificationData): Notification {
    return new Notification(data)
  }

  // Getters
  get id(): string {
    return this.data.id
  }

  get userId(): string {
    return this.data.userId
  }

  get type(): NotificationType {
    return this.data.type
  }

  get title(): MultilingualText {
    return { ...this.data.title }
  }

  get body(): MultilingualText {
    return { ...this.data.body }
  }

  get icon(): string | undefined {
    return this.data.icon
  }

  get entityRef(): EntityReference | undefined {
    return this.data.entityRef ? { ...this.data.entityRef } : undefined
  }

  get read(): boolean {
    return this.data.read
  }

  get createdAt(): Date {
    return this.data.createdAt
  }

  get expiresAt(): Date | undefined {
    return this.data.expiresAt
  }

  // Business methods
  markAsRead(): Notification {
    if (this.data.read) {
      return this // Already read
    }

    return new Notification({
      ...this.data,
      read: true,
    })
  }

  isExpired(): boolean {
    if (!this.data.expiresAt) return false

    return new Date() > this.data.expiresAt
  }

  canBeDisplayed(): boolean {
    return !this.isExpired() && !this.data.read
  }

  getLocalizedTitle(language: string): string {
    const lang = language as keyof MultilingualText

    return (
      get(this.data.title, lang) ||
      this.data.title.en ||
      Object.values(this.data.title)[0]
    )
  }

  getLocalizedBody(language: string): string {
    const lang = language as keyof MultilingualText

    return (
      get(this.data.body, lang) ||
      this.data.body.en ||
      Object.values(this.data.body)[0]
    )
  }

  // Persistence helper
  toFirebaseData(): Record<string, any> {
    const data: Record<string, any> = {
      userId: this.data.userId,
      type: this.data.type,
      title: this.data.title,
      body: this.data.body,
      read: this.data.read,
      createdAt: this.data.createdAt,
    }

    // Only include optional fields if they have values
    if (this.data.icon !== undefined) {
      data.icon = this.data.icon
    }

    if (this.data.entityRef !== undefined) {
      data.entityRef = {
        entityType: this.data.entityRef.entityType,
        entityId: this.data.entityRef.entityId,
      }
    }

    if (this.data.expiresAt !== undefined) {
      data.expiresAt = this.data.expiresAt
    }

    return data
  }

  toObject(): NotificationData {
    return {
      ...this.data,
      title: { ...this.data.title },
      body: { ...this.data.body },
      entityRef: this.data.entityRef ? { ...this.data.entityRef } : undefined,
    }
  }
}
