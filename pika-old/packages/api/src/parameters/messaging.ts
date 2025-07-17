import { OpenAPIV3 } from 'openapi-types'

export const ConversationIdParam: OpenAPIV3.ParameterObject = {
  name: 'conversationId',
  in: 'path',
  required: true,
  description: 'Unique identifier for the conversation',
  schema: {
    type: 'string',
    format: 'uuid',
  },
}

export const MessageIdParam: OpenAPIV3.ParameterObject = {
  name: 'messageId',
  in: 'path',
  required: true,
  description: 'Unique identifier for the message',
  schema: {
    type: 'string',
    format: 'uuid',
  },
}

export const MessagesLimitParam: OpenAPIV3.ParameterObject = {
  name: 'limit',
  in: 'query',
  required: false,
  description: 'Maximum number of messages to return',
  schema: {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
  },
}

export const MessagesBeforeParam: OpenAPIV3.ParameterObject = {
  name: 'before',
  in: 'query',
  required: false,
  description: 'Return messages sent before this timestamp',
  schema: {
    type: 'string',
    format: 'date-time',
  },
}

export const MessagesAfterParam: OpenAPIV3.ParameterObject = {
  name: 'after',
  in: 'query',
  required: false,
  description: 'Return messages sent after this timestamp',
  schema: {
    type: 'string',
    format: 'date-time',
  },
}

export const ConversationsLimitParam: OpenAPIV3.ParameterObject = {
  name: 'limit',
  in: 'query',
  required: false,
  description: 'Maximum number of conversations to return',
  schema: {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
  },
}

export const ConversationsOffsetParam: OpenAPIV3.ParameterObject = {
  name: 'offset',
  in: 'query',
  required: false,
  description: 'Number of conversations to skip for pagination',
  schema: {
    type: 'integer',
    minimum: 0,
    default: 0,
  },
}

export const IncludeArchivedParam: OpenAPIV3.ParameterObject = {
  name: 'includeArchived',
  in: 'query',
  required: false,
  description: 'Whether to include archived conversations',
  schema: {
    type: 'boolean',
    default: false,
  },
}

export const NotificationIdParam: OpenAPIV3.ParameterObject = {
  name: 'notificationId',
  in: 'path',
  required: true,
  description: 'Unique identifier for the notification',
  schema: {
    type: 'string',
    format: 'uuid',
  },
}

export const NotificationsLimitParam: OpenAPIV3.ParameterObject = {
  name: 'limit',
  in: 'query',
  required: false,
  description: 'Maximum number of notifications to return',
  schema: {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
  },
}

export const NotificationsOffsetParam: OpenAPIV3.ParameterObject = {
  name: 'offset',
  in: 'query',
  required: false,
  description: 'Number of notifications to skip for pagination',
  schema: {
    type: 'integer',
    minimum: 0,
    default: 0,
  },
}

export const UnreadOnlyParam: OpenAPIV3.ParameterObject = {
  name: 'unreadOnly',
  in: 'query',
  required: false,
  description: 'Filter to only unread notifications',
  schema: {
    type: 'boolean',
    default: false,
  },
}

export const NotificationTypesParam: OpenAPIV3.ParameterObject = {
  name: 'types',
  in: 'query',
  required: false,
  description: 'Filter notifications by specific types',
  style: 'form',
  explode: false,
  schema: {
    type: 'array',
    items: {
      type: 'string',
      enum: [
        'BOOKING_CREATED',
        'BOOKING_CANCELLED',
        'BOOKING_CONFIRMED',
        'SERVICE_UPDATED',
        'SERVICE_RESCHEDULED',
        'PAYMENT_RECEIVED',
        'PAYMENT_FAILED',
        'MESSAGE_RECEIVED',
        'REVIEW_RECEIVED',
        'SYSTEM_ANNOUNCEMENT',
      ],
    },
  },
}
