import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'
import { MultilingualText } from '@pika/types-core'
import { get } from 'lodash-es'

export interface NotificationRead {
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
  constructor(private readonly data: NotificationRead) {}

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

  // Query methods
  isExpired(): boolean {
    if (!this.data.expiresAt) return false

    return new Date() > this.data.expiresAt
  }

  canBeDisplayed(): boolean {
    return !this.isExpired()
  }

  getLocalizedTitle(language: string): string {
    return (
      get(this.data.title, language) ||
      this.data.title.en ||
      Object.values(this.data.title)[0]
    )
  }

  getLocalizedBody(language: string): string {
    return (
      get(this.data.body, language) ||
      this.data.body.en ||
      Object.values(this.data.body)[0]
    )
  }

  getAgeInMinutes(): number {
    const now = new Date()
    const diffMs = now.getTime() - this.data.createdAt.getTime()

    return Math.floor(diffMs / (1000 * 60))
  }

  getRelativeTime(): string {
    const ageInMinutes = this.getAgeInMinutes()

    if (ageInMinutes < 1) {
      return 'Just now'
    } else if (ageInMinutes < 60) {
      return `${ageInMinutes}m ago`
    } else if (ageInMinutes < 24 * 60) {
      const hours = Math.floor(ageInMinutes / 60)

      return `${hours}h ago`
    } else {
      const days = Math.floor(ageInMinutes / (24 * 60))

      return `${days}d ago`
    }
  }

  toObject(): NotificationRead {
    return {
      ...this.data,
      title: { ...this.data.title },
      body: { ...this.data.body },
      entityRef: this.data.entityRef ? { ...this.data.entityRef } : undefined,
    }
  }

  static fromFirebaseData(id: string, data: any): Notification {
    return new Notification({
      id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      icon: data.icon,
      entityRef: data.entityRef,
      read: data.read,
      createdAt: data.createdAt.toDate(),
      expiresAt: data.expiresAt?.toDate(),
    })
  }
}
