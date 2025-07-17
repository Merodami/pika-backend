// Export main types and interfaces
export type {
  ConversationContext,
  ConversationParticipant,
  EnhancedMessageMetadata,
  EntityReference,
  MessageStatus,
  MessageType,
  NotificationPreferences,
  NotificationType,
  PushNotificationPayload,
} from '@communication-shared/types/index.js'

// Export domain entities (read models)
export { Conversation as ConversationRead } from '@communication-read/domain/entities/Conversation.js'
export { Message as MessageRead } from '@communication-read/domain/entities/Message.js'
export { Notification as NotificationRead } from '@communication-read/domain/entities/Notification.js'

// Export repository ports
export type { ConversationReadRepositoryPort } from '@communication-read/domain/ports/ConversationReadRepositoryPort.js'
export type { MessageReadRepositoryPort } from '@communication-read/domain/ports/MessageReadRepositoryPort.js'
export type { NotificationReadRepositoryPort } from '@communication-read/domain/ports/NotificationReadRepositoryPort.js'
export type { ConversationWriteRepositoryPort } from '@communication-write/domain/ports/ConversationWriteRepositoryPort.js'
export type { MessageWriteRepositoryPort } from '@communication-write/domain/ports/MessageWriteRepositoryPort.js'
export type { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'

// Export domain services
export type { PushNotificationQueue } from '@communication-write/domain/services/NotificationBatcher.js'
export { NotificationBatcher } from '@communication-write/domain/services/NotificationBatcher.js'
export type { NotificationOrchestrator } from '@communication-write/domain/services/NotificationOrchestrator.js'
export { FirebasePushQueue } from '@communication-write/infrastructure/queue/FirebasePushQueue.js'
