import { ErrorResponseSchema } from '@api/responses/errors.js'
import { registry } from '@api/schemaRegistry.js'

import * as schemas from './schemas/index.js'

// Errors schemas
registry.register('ErrorResponse', ErrorResponseSchema)

// Shared schemas
registry.register('Error', schemas.ErrorSchema)
registry.register('Message', schemas.MessageSchema)
registry.register('PaginationMetadata', schemas.PaginationMetadataSchema)
registry.register('GeoPoint', schemas.GeoPointSchema)
registry.register('Metadata', schemas.MetadataSchema)
registry.register('APIDocsResponse', schemas.APIDocsResponseSchema)

// System schemas
registry.register('HealthCheckResponse', schemas.HealthCheckResponseSchema)
registry.register('MemoryUsage', schemas.MemoryUsageSchema)
registry.register('ServiceHealth', schemas.ServiceHealthSchema)
registry.register('ServicesHealth', schemas.ServicesHealthSchema)
registry.register('HealthStatus', schemas.HealthStatusSchema)
registry.register('DatabasesHealth', schemas.DatabasesHealthSchema)
registry.register('PostgreSQLHealth', schemas.PostgreSQLHealthSchema)
registry.register('RedisHealth', schemas.RedisHealthSchema)
registry.register('Queue', schemas.QueueSchema)
registry.register('EventBusHealth', schemas.EventBusHealthSchema)
registry.register('MessageQueueHealth', schemas.MessageQueueHealthSchema)

// Auth schemas
registry.register('UserRegistration', schemas.UserRegistrationSchema)
registry.register('Login', schemas.LoginSchema)
registry.register('AuthResponse', schemas.AuthResponseSchema)
registry.register('RefreshTokenRequest', schemas.RefreshTokenRequestSchema)
registry.register('ForgotPasswordRequest', schemas.ForgotPasswordRequestSchema)
registry.register('ResetPasswordRequest', schemas.ResetPasswordRequestSchema)
registry.register('VerifyEmailRequest', schemas.VerifyEmailRequestSchema)
registry.register('MessageResponse', schemas.MessageResponseSchema)

// Token Exchange schemas
registry.register('DeviceInfo', schemas.DeviceInfoSchema)
registry.register('TokenExchangeRequest', schemas.TokenExchangeRequestSchema)
registry.register('TokenExchangeUser', schemas.TokenExchangeUserSchema)
registry.register('TokenExchangeResponse', schemas.TokenExchangeResponseSchema)

// User schemas
registry.register('UserProfile', schemas.UserProfileSchema)
registry.register('UserProfileUpdate', schemas.UserProfileUpdateSchema)
registry.register('Address', schemas.AddressSchema)
registry.register('AddressCreate', schemas.AddressCreateSchema)
registry.register('AddressUpdate', schemas.AddressUpdateSchema)
registry.register('AddressListResponse', schemas.AddressListResponseSchema)
registry.register('PaymentMethod', schemas.PaymentMethodSchema)
registry.register('PaymentMethodCreate', schemas.PaymentMethodCreateSchema)
registry.register('PaymentMethodUpdate', schemas.PaymentMethodUpdateSchema)
registry.register(
  'PaymentMethodListResponse',
  schemas.PaymentMethodListResponseSchema,
)

// Provider schemas
registry.register('ProviderProfile', schemas.ProviderProfileSchema)
registry.register('ProviderProfileCreate', schemas.ProviderProfileCreateSchema)
registry.register('ProviderProfileUpdate', schemas.ProviderProfileUpdateSchema)
registry.register(
  'ProviderProfileListResponse',
  schemas.ProviderProfileListResponseSchema,
)

// Provider schemas
registry.register('ProviderProfile', schemas.ProviderProfileSchema)
registry.register('ProviderProfileCreate', schemas.ProviderProfileCreateSchema)
registry.register('ProviderProfileUpdate', schemas.ProviderProfileUpdateSchema)
registry.register(
  'ProviderProfileListResponse',
  schemas.ProviderProfileListResponseSchema,
)
registry.register('ProviderSearchQuery', schemas.ProviderSearchQuerySchema)
registry.register('ProviderGetQuery', schemas.ProviderGetQuerySchema)
registry.register('ProviderId', schemas.ProviderIdSchema)

// Category schemas
registry.register('Category', schemas.CategorySchema)
registry.register('CategoryCreate', schemas.CategoryCreateSchema)
registry.register('CategoryUpdate', schemas.CategoryUpdateSchema)
registry.register('CategorySearchQuery', schemas.CategorySearchQuerySchema)
registry.register('CategoryListResponse', schemas.CategoryListResponseSchema)
registry.register('CategoryId', schemas.CategoryIdSchema)

// Campaign schemas
registry.register('Campaign', schemas.CampaignSchema)
registry.register('CampaignCreate', schemas.CampaignCreateSchema)
registry.register('CampaignUpdate', schemas.CampaignUpdateSchema)
registry.register('CampaignSearchQuery', schemas.CampaignSearchQuerySchema)
registry.register('CampaignListResponse', schemas.CampaignListResponseSchema)
registry.register('CampaignId', schemas.CampaignIdSchema)

// Voucher schemas
registry.register('Voucher', schemas.VoucherSchema)
registry.register('VoucherCreate', schemas.VoucherCreateSchema)
registry.register('VoucherUpdate', schemas.VoucherUpdateSchema)
registry.register('VoucherSearchQuery', schemas.VoucherSearchQuerySchema)
registry.register('VoucherListResponse', schemas.VoucherListResponseSchema)
registry.register('VoucherId', schemas.VoucherIdSchema)
registry.register('VoucherPublish', schemas.VoucherPublishSchema)
registry.register('VoucherClaim', schemas.VoucherClaimSchema)
registry.register('VoucherRedeem', schemas.VoucherRedeemSchema)

// PDF/VoucherBook schemas
registry.register('VoucherBook', schemas.VoucherBookSchema)
registry.register('VoucherBookCreate', schemas.VoucherBookCreateSchema)
registry.register('VoucherBookUpdate', schemas.VoucherBookUpdateSchema)
registry.register(
  'VoucherBookStatusUpdate',
  schemas.VoucherBookStatusUpdateSchema,
)
registry.register(
  'VoucherBookSearchQuery',
  schemas.VoucherBookSearchQuerySchema,
)
registry.register(
  'VoucherBookListResponse',
  schemas.VoucherBookListResponseSchema,
)
registry.register('VoucherBookId', schemas.VoucherBookIdSchema)

// Review schemas
registry.register('Review', schemas.ReviewSchema)
registry.register('ReviewCreate', schemas.ReviewCreateSchema)
registry.register('ReviewUpdate', schemas.ReviewUpdateSchema)
registry.register('ReviewResponseCreate', schemas.ReviewResponseCreateSchema)
registry.register('ReviewListResponse', schemas.ReviewListResponseSchema)
registry.register('ReviewSearchQuery', schemas.ReviewSearchQuerySchema)
registry.register('ReviewId', schemas.ReviewIdSchema)

// Payment schemas
registry.register('PaymentStatus', schemas.PaymentStatusEnum)
registry.register('Payment', schemas.PaymentSchema)
registry.register(
  'PaymentInitiationRequest',
  schemas.PaymentInitiationRequestSchema,
)
registry.register('PaymentInitiation', schemas.PaymentInitiationSchema)
registry.register(
  'PaymentProcessorCallback',
  schemas.PaymentProcessorCallbackSchema,
)
registry.register(
  'PaymentProcessorResponse',
  schemas.PaymentProcessorResponseSchema,
)
registry.register('PaymentListResponse', schemas.PaymentListResponseSchema)
registry.register('PaymentSearchQuery', schemas.PaymentSearchQuerySchema)

// Notification schemas
registry.register('NotificationType', schemas.NotificationTypeSchema)
registry.register('EntityRef', schemas.EntityRefSchema)
registry.register('Notification', schemas.NotificationSchema)
registry.register(
  'PublishNotificationRequest',
  schemas.PublishNotificationRequestSchema,
)
registry.register(
  'PublishNotificationResponse',
  schemas.PublishNotificationResponseSchema,
)
registry.register('GetNotificationsQuery', schemas.GetNotificationsQuerySchema)
registry.register(
  'GetNotificationsResponse',
  schemas.GetNotificationsResponseSchema,
)
registry.register(
  'MarkNotificationAsReadParams',
  schemas.MarkNotificationAsReadParamsSchema,
)
registry.register(
  'PublishBatchNotificationsRequest',
  schemas.PublishBatchNotificationsRequestSchema,
)
registry.register(
  'PublishBatchNotificationsResponse',
  schemas.PublishBatchNotificationsResponseSchema,
)

// Messaging schemas
registry.register('MessageType', schemas.MessageTypeSchema)
registry.register('MessageStatus', schemas.MessageStatusSchema)
registry.register('ConversationContext', schemas.ConversationContextSchema)
registry.register('Participant', schemas.ParticipantSchema)
registry.register('MessageMetadata', schemas.MessageMetadataSchema)
registry.register('ReplyTo', schemas.ReplyToSchema)
registry.register('MessageStatusDetails', schemas.MessageStatusDetailsSchema)
registry.register('EditHistory', schemas.EditHistorySchema)
registry.register('ChatMessage', schemas.ChatMessageSchema)
registry.register(
  'ConversationContextDetails',
  schemas.ConversationContextDetailsSchema,
)
registry.register('LastMessage', schemas.LastMessageSchema)
registry.register('Conversation', schemas.ConversationSchema)
registry.register(
  'CreateConversationRequest',
  schemas.CreateConversationRequestSchema,
)
registry.register(
  'CreateConversationResponse',
  schemas.CreateConversationResponseSchema,
)
registry.register('SendMessageRequest', schemas.SendMessageRequestSchema)
registry.register('SendMessageResponse', schemas.SendMessageResponseSchema)
registry.register(
  'MarkMessagesReadRequest',
  schemas.MarkMessagesReadRequestSchema,
)
registry.register(
  'MarkMessagesReadResponse',
  schemas.MarkMessagesReadResponseSchema,
)
registry.register('GetConversationsQuery', schemas.GetConversationsQuerySchema)
registry.register(
  'GetConversationsResponse',
  schemas.GetConversationsResponseSchema,
)
registry.register('GetMessagesQuery', schemas.GetMessagesQuerySchema)
registry.register('GetMessagesResponse', schemas.GetMessagesResponseSchema)

// System schemas
registry.register('HealthCheckResponse', schemas.HealthCheckResponseSchema)

// Firebase auth schemas
registry.register(
  'FirebaseTokenHealthError',
  schemas.FirebaseTokenHealthErrorSchema,
)
registry.register('FirebaseTokenHealthOk', schemas.FirebaseTokenHealthOkSchema)
