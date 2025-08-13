/**
 * Support service-related enums
 */

/**
 * Support ticket status
 */
export enum TicketStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'inProgress',
  WAITING_CUSTOMER = 'waitingCustomer',
  WAITING_INTERNAL = 'waitingInternal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Support ticket priority levels
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Support ticket types (categories)
 */
export enum TicketType {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  GENERAL = 'general',
  BUG_REPORT = 'bugReport',
  FEATURE_REQUEST = 'featureRequest',
}

/**
 * Admin ticket sorting fields
 */
export enum AdminTicketSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  RESOLVED_AT = 'resolvedAt',
  PRIORITY = 'priority',
  STATUS = 'status',
}

/**
 * Comment sorting fields
 */
export enum CommentSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Ticket sorting fields
 */
export enum TicketSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRIORITY = 'priority',
  STATUS = 'status',
}

/**
 * Comment actions
 */
export enum CommentAction {
  DELETE = 'delete',
  MAKE_PUBLIC = 'makePublic',
  MAKE_PRIVATE = 'makePrivate',
  CHANGE_STATUS = 'changeStatus',
}

/**
 * Ticket update types for internal tracking
 */
export enum TicketUpdateType {
  STATUS_CHANGE = 'statusChange',
  ASSIGNMENT = 'assignment',
  PRIORITY_CHANGE = 'priorityChange',
  COMMENT_ADDED = 'commentAdded',
  ATTACHMENT_ADDED = 'attachmentAdded',
  MERGED = 'merged',
  ESCALATED = 'escalated',
}

/**
 * Ticket escalation types
 */
export enum TicketEscalationType {
  PRIORITY = 'priority',
  MANUAL = 'manual',
  AUTO_TIME_BASED = 'autoTimeBased',
  AUTO_RESPONSE_TIME = 'autoResponseTime',
  CUSTOMER_REQUEST = 'customerRequest',
}
