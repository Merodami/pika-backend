export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum ConversationType {
  CUSTOMER_PROVIDER = 'CUSTOMER_PROVIDER',
  GROUP = 'GROUP',
}

export enum ConversationContext {
  VOUCHER = 'VOUCHER',
  PROVIDER = 'PROVIDER',
  SUPPORT = 'SUPPORT',
  GENERAL = 'GENERAL',
}

export enum NotificationType {
  // Message notifications
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',

  // Voucher notifications
  VOUCHER_CREATED = 'VOUCHER_CREATED',
  VOUCHER_UPDATED = 'VOUCHER_UPDATED',
  VOUCHER_EXPIRED = 'VOUCHER_EXPIRED',
  VOUCHER_CLAIMED = 'VOUCHER_CLAIMED',
  VOUCHER_REDEEMED = 'VOUCHER_REDEEMED',

  // Provider notifications
  PROVIDER_UPDATED = 'PROVIDER_UPDATED',

  // Payment notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Review notifications
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',

  // System notifications
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export interface ConversationParticipant {
  userId: string
  userType: 'CUSTOMER' | 'PROVIDER'
  joinedAt: Date
  lastReadAt?: Date
  lastReadMessageId?: string
  isArchived: boolean
  isBlocked: boolean
  isMuted: boolean
  unreadCount: number
}

export interface EnhancedMessageMetadata {
  // File attachments
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mimeType?: string

  // Rich previews
  preview?: {
    thumbnailUrl?: string
    dimensions?: { width: number; height: number }
    duration?: number // For videos/audio
  }

  // Link previews
  links?: Array<{
    url: string
    title?: string
    description?: string
    imageUrl?: string
    favicon?: string
  }>

  // Mentions (future enhancement)
  mentions?: string[]
}

export interface NotificationPreferences {
  userId: string
  channels: {
    inApp: boolean // Always true
    push: boolean // Mobile push notifications
    email: boolean // Future: Email notifications
  }
  quiet: {
    enabled: boolean
    startTime: string // "22:00"
    endTime: string // "08:00"
  }
  messageGrouping: {
    enabled: boolean
    windowSeconds: number // Default: 30
  }
}

export interface EntityReference {
  entityType: string
  entityId: string
}

export interface PushNotificationPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, any>
  priority?: 'HIGH' | 'NORMAL' | 'LOW'
  scheduledFor?: Date
}
