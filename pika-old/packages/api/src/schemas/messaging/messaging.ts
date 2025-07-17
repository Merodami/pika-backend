import { Static, Type } from '@sinclair/typebox'

import { PaginationMetadataSchema } from '../shared/pagination.js'
import { NonEmptyString, UUIDSchema } from '../utils/uuid.js'

// Message types enum
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

// Message status enum
export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

// Conversation context enum
export enum ConversationContext {
  VOUCHER_REDEMPTION = 'VOUCHER_REDEMPTION',
  VOUCHER_INQUIRY = 'VOUCHER_INQUIRY',
  PROVIDER_INQUIRY = 'PROVIDER_INQUIRY',
  GENERAL = 'GENERAL',
}

// Message type schema as string union
export const MessageTypeSchema = Type.Union([
  Type.Literal('TEXT'),
  Type.Literal('IMAGE'),
  Type.Literal('FILE'),
  Type.Literal('SYSTEM'),
])

// Message status schema as string union
export const MessageStatusSchema = Type.Union([
  Type.Literal('SENT'),
  Type.Literal('DELIVERED'),
  Type.Literal('READ'),
])

// Conversation context schema as string union
export const ConversationContextSchema = Type.Union([
  Type.Literal('VOUCHER_REDEMPTION'),
  Type.Literal('VOUCHER_INQUIRY'),
  Type.Literal('PROVIDER_INQUIRY'),
  Type.Literal('GENERAL'),
])

// Participant schema
export const ParticipantSchema = Type.Object({
  userId: UUIDSchema,
  userType: Type.Union([Type.Literal('CUSTOMER'), Type.Literal('PROVIDER')]),
  joinedAt: Type.String({ format: 'date-time' }),
  lastReadAt: Type.Optional(Type.String({ format: 'date-time' })),
  lastReadMessageId: Type.Optional(UUIDSchema),
  isArchived: Type.Boolean({ default: false }),
  isBlocked: Type.Boolean({ default: false }),
  isMuted: Type.Boolean({ default: false }),
  unreadCount: Type.Integer({ minimum: 0, default: 0 }),
})

export type Participant = Static<typeof ParticipantSchema>

// Message metadata schema
export const MessageMetadataSchema = Type.Object({
  fileName: Type.Optional(Type.String({ maxLength: 255 })),
  fileSize: Type.Optional(Type.Integer({ minimum: 0 })),
  fileUrl: Type.Optional(Type.String({ maxLength: 500 })),
  thumbnailUrl: Type.Optional(Type.String({ maxLength: 500 })),
  mimeType: Type.Optional(Type.String({ maxLength: 100 })),
})

export type MessageMetadata = Static<typeof MessageMetadataSchema>

// Reply-to schema
export const ReplyToSchema = Type.Object({
  messageId: UUIDSchema,
  content: NonEmptyString(500),
  senderId: UUIDSchema,
})

export type ReplyTo = Static<typeof ReplyToSchema>

// Message status details schema
export const MessageStatusDetailsSchema = Type.Object({
  sent: Type.String({ format: 'date-time' }),
  delivered: Type.Optional(Type.String({ format: 'date-time' })),
  read: Type.Optional(Type.String({ format: 'date-time' })),
})

export type MessageStatusDetails = Static<typeof MessageStatusDetailsSchema>

// Edit history schema
export const EditHistorySchema = Type.Object({
  content: NonEmptyString(1000),
  editedAt: Type.String({ format: 'date-time' }),
})

export type EditHistory = Static<typeof EditHistorySchema>

// Chat message schema (renamed to avoid conflict with system Message)
export const ChatMessageSchema = Type.Object({
  id: UUIDSchema,
  conversationId: UUIDSchema,
  senderId: UUIDSchema,
  senderType: Type.Union([Type.Literal('CUSTOMER'), Type.Literal('PROVIDER')]),
  type: MessageTypeSchema,
  content: NonEmptyString(1000),
  metadata: Type.Optional(MessageMetadataSchema),
  status: MessageStatusDetailsSchema,
  replyTo: Type.Optional(ReplyToSchema),
  editHistory: Type.Optional(Type.Array(EditHistorySchema)),
  deletedAt: Type.Optional(Type.String({ format: 'date-time' })),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export type ChatMessage = Static<typeof ChatMessageSchema>

// Conversation context details schema
export const ConversationContextDetailsSchema = Type.Object({
  type: ConversationContextSchema,
  id: UUIDSchema,
  metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
})

export type ConversationContextDetails = Static<
  typeof ConversationContextDetailsSchema
>

// Last message schema
export const LastMessageSchema = Type.Object({
  id: UUIDSchema,
  content: NonEmptyString(1000),
  senderId: UUIDSchema,
  sentAt: Type.String({ format: 'date-time' }),
  type: MessageTypeSchema,
})

export type LastMessage = Static<typeof LastMessageSchema>

// Conversation schema
export const ConversationSchema = Type.Object({
  id: UUIDSchema,
  participants: Type.Array(ParticipantSchema),
  lastMessage: Type.Optional(LastMessageSchema),
  context: Type.Optional(ConversationContextDetailsSchema),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

export type Conversation = Static<typeof ConversationSchema>

// Participant ID schema - allows UUIDs or specific test values
const ParticipantIdSchema = Type.String({
  anyOf: [
    { format: 'uuid', pattern: '^[0-9a-fA-F-]{36}$' },
    { enum: ['internal'] },
  ],
  description: 'User ID - either UUID format or test value "internal"',
})

// Create conversation request schema
export const CreateConversationRequestSchema = Type.Object({
  participantIds: Type.Array(ParticipantIdSchema, { minItems: 2, maxItems: 2 }),
  context: Type.Optional(ConversationContextDetailsSchema),
})

export type CreateConversationRequest = Static<
  typeof CreateConversationRequestSchema
>

// Create conversation response schema
export const CreateConversationResponseSchema = Type.Object({
  conversationId: UUIDSchema,
})

export type CreateConversationResponse = Static<
  typeof CreateConversationResponseSchema
>

// Send message request schema
export const SendMessageRequestSchema = Type.Object({
  type: Type.Optional(MessageTypeSchema),
  content: NonEmptyString(1000),
  metadata: Type.Optional(MessageMetadataSchema),
  replyToId: Type.Optional(UUIDSchema),
})

export type SendMessageRequest = Static<typeof SendMessageRequestSchema>

// Send message response schema
export const SendMessageResponseSchema = Type.Object({
  messageId: UUIDSchema,
})

export type SendMessageResponse = Static<typeof SendMessageResponseSchema>

// Mark messages as read request schema
export const MarkMessagesReadRequestSchema = Type.Object({
  messageIds: Type.Array(UUIDSchema, { minItems: 1 }),
})

export type MarkMessagesReadRequest = Static<
  typeof MarkMessagesReadRequestSchema
>

// Mark messages as read response schema
export const MarkMessagesReadResponseSchema = Type.Object({
  success: Type.Boolean(),
})

export type MarkMessagesReadResponse = Static<
  typeof MarkMessagesReadResponseSchema
>

// Get conversations query parameters
export const GetConversationsQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  includeArchived: Type.Optional(Type.Boolean({ default: false })),
})

export type GetConversationsQuery = Static<typeof GetConversationsQuerySchema>

// Get conversations response schema
export const GetConversationsResponseSchema = Type.Object({
  conversations: Type.Array(ConversationSchema),
  pagination: PaginationMetadataSchema,
})

export type GetConversationsResponse = Static<
  typeof GetConversationsResponseSchema
>

// Get messages query parameters
export const GetMessagesQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  before: Type.Optional(Type.String({ format: 'date-time' })),
  after: Type.Optional(Type.String({ format: 'date-time' })),
})

export type GetMessagesQuery = Static<typeof GetMessagesQuerySchema>

// Get messages response schema
export const GetMessagesResponseSchema = Type.Object({
  messages: Type.Array(ChatMessageSchema),
  pagination: Type.Object({
    limit: Type.Integer({ minimum: 1 }),
    hasMore: Type.Boolean(),
  }),
})

export type GetMessagesResponse = Static<typeof GetMessagesResponseSchema>
