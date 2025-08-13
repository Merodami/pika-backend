import {
  BounceType as BounceTypeEnum,
  CommunicationChannel as CommunicationChannelEnum,
  CommunicationDirection as CommunicationDirectionEnum,
  CommunicationGroupBy as CommunicationGroupByEnum,
  CommunicationLogSortBy as CommunicationLogSortByEnum,
  CommunicationStatus as CommunicationStatusEnum,
  DevicePlatform as DevicePlatformEnum,
  EmailEvent as EmailEventEnum,
  EmailSortBy as EmailSortByEnum,
  EmailStatus as EmailStatusEnum,
  EmailTemplateKey as EmailTemplateKeyEnum,
  InAppNotificationType as InAppNotificationTypeEnum,
  MessagePriority,
  MessageType as MessageTypeEnum,
  NotificationCategory as NotificationCategoryEnum,
  NotificationSortBy as NotificationSortByEnum,
  NotificationStatus as NotificationStatusEnum,
  NotificationType as NotificationTypeEnum,
  TemplateCategory as TemplateCategoryEnum,
  TemplateSortBy as TemplateSortByEnum,
  TemplateType as TemplateTypeEnum,
  TemplateVariableType as TemplateVariableTypeEnum,
} from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Communication-specific enums
 */

// ============= Email Enums =============

export const EmailStatus = createZodEnum(EmailStatusEnum)

export const EmailStatusSchema = EmailStatus.openapi('EmailStatus', {
  description: 'Email delivery status',
  example: 'sent',
})

export type EmailStatus = z.infer<typeof EmailStatus>

export const EmailPriority = createZodEnum(MessagePriority)

export type EmailPriority = z.infer<typeof EmailPriority>

export const BounceType = createZodEnum(BounceTypeEnum)

export type BounceType = z.infer<typeof BounceType>

export const EmailEvent = createZodEnum(EmailEventEnum)

export type EmailEvent = z.infer<typeof EmailEvent>

export const EmailSortBy = createZodEnum(EmailSortByEnum)

export type EmailSortBy = z.infer<typeof EmailSortBy>

// ============= Notification Enums =============

export const NotificationType = createZodEnum(NotificationTypeEnum)

export const NotificationTypeSchema = NotificationType.openapi(
  'NotificationType',
  {
    description: 'Type of notification channel',
    example: 'email',
  },
)

export type NotificationType = z.infer<typeof NotificationType>

export const NotificationStatus = createZodEnum(NotificationStatusEnum)

export const NotificationStatusSchema = NotificationStatus.openapi(
  'NotificationStatus',
  {
    description: 'Notification delivery status',
    example: 'sent',
  },
)

export type NotificationStatus = z.infer<typeof NotificationStatus>

export const NotificationPriority = createZodEnum(MessagePriority)

export type NotificationPriority = z.infer<typeof NotificationPriority>

export const NotificationSortBy = createZodEnum(NotificationSortByEnum)

export type NotificationSortBy = z.infer<typeof NotificationSortBy>

export const CommunicationLogSortBy = createZodEnum(CommunicationLogSortByEnum)

export type CommunicationLogSortBy = z.infer<typeof CommunicationLogSortBy>

export const TemplateSortBy = createZodEnum(TemplateSortByEnum)

export type TemplateSortBy = z.infer<typeof TemplateSortBy>

export const DevicePlatform = createZodEnum(DevicePlatformEnum)

export type DevicePlatform = z.infer<typeof DevicePlatform>

// ============= Communication Log Enums =============

export const CommunicationChannel = createZodEnum(CommunicationChannelEnum)

export const CommunicationChannelSchema = CommunicationChannel.openapi(
  'CommunicationChannel',
  {
    description: 'Communication channel type',
    example: 'email',
  },
)

export type CommunicationChannel = z.infer<typeof CommunicationChannel>

export const CommunicationStatus = createZodEnum(CommunicationStatusEnum)

export const CommunicationStatusSchema = CommunicationStatus.openapi(
  'CommunicationStatus',
  {
    description: 'Communication delivery status',
    example: 'sent',
  },
)

export type CommunicationStatus = z.infer<typeof CommunicationStatus>

export const CommunicationDirection = createZodEnum(CommunicationDirectionEnum)

export type CommunicationDirection = z.infer<typeof CommunicationDirection>

export const CommunicationGroupBy = createZodEnum(CommunicationGroupByEnum)

export type CommunicationGroupBy = z.infer<typeof CommunicationGroupBy>

// ============= Template Enums =============

export const TemplateType = createZodEnum(TemplateTypeEnum)

export type TemplateType = z.infer<typeof TemplateType>

export const TemplateCategory = createZodEnum(TemplateCategoryEnum)

export type TemplateCategory = z.infer<typeof TemplateCategory>

export const TemplateVariableType = createZodEnum(TemplateVariableTypeEnum)

export type TemplateVariableType = z.infer<typeof TemplateVariableType>

// ============= Internal Service Enums =============

export const NotificationCategory = createZodEnum(NotificationCategoryEnum)

export type NotificationCategory = z.infer<typeof NotificationCategory>

export const EmailTemplateKey = createZodEnum(EmailTemplateKeyEnum)

export type EmailTemplateKey = z.infer<typeof EmailTemplateKey>

export const MessageType = createZodEnum(MessageTypeEnum)

export type MessageType = z.infer<typeof MessageType>

export const InAppNotificationType = createZodEnum(InAppNotificationTypeEnum)

export type InAppNotificationType = z.infer<typeof InAppNotificationType>
