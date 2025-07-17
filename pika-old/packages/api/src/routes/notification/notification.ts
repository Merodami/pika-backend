import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Notification routes
export const NotificationRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/notifications': {
      get: {
        tags: ['Notifications'],
        operationId: 'getUserNotifications',
        summary: 'Get user notifications',
        description:
          'Retrieve a paginated list of notifications for the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          registry.refParameter('notificationsLimitParam'),
          registry.refParameter('notificationsOffsetParam'),
          registry.refParameter('unreadOnlyParam'),
          registry.refParameter('notificationTypesParam'),
        ],
        responses: {
          '200': {
            description: 'Notifications retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('GetNotificationsResponse'),
                examples: {
                  notifications: {
                    summary: 'List of user notifications',
                    value: {
                      notifications: [
                        {
                          id: '123e4567-e89b-12d3-a456-426614174000',
                          userId: '456e7890-e12b-12d3-a456-426614174000',
                          type: 'VOUCHER_REDEEMED',
                          title: 'Voucher Redeemed',
                          body: 'A customer has redeemed your discount voucher.',
                          icon: 'voucher',
                          entityRef: {
                            entityType: 'VOUCHER_REDEMPTION',
                            entityId: 'redeem123-e89b-12d3-a456-426614174000',
                          },
                          read: false,
                          createdAt: '2025-05-07T15:00:00Z',
                        },
                        {
                          id: '789e0123-e45b-12d3-a456-426614174000',
                          userId: '456e7890-e12b-12d3-a456-426614174000',
                          type: 'MESSAGE_RECEIVED',
                          title: 'New Message',
                          body: 'You have received a new message from Maria Gonzalez.',
                          icon: 'message',
                          entityRef: {
                            entityType: 'CONVERSATION',
                            entityId: 'conv456-e89b-12d3-a456-426614174000',
                          },
                          read: true,
                          createdAt: '2025-05-07T14:30:00Z',
                        },
                      ],
                      unreadCount: 1,
                      total: 15,
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '500': registry.refResponse('ServerError'),
        },
      },
    },
    '/api/v1/notifications/publish': {
      post: {
        tags: ['Notifications'],
        operationId: 'publishNotification',
        summary: 'Publish a notification',
        description:
          'Create and send a new notification to a user (internal service use)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('PublishNotificationRequest'),
              examples: {
                voucherNotification: {
                  summary: 'Voucher notification',
                  value: {
                    userId: '456e7890-e12b-12d3-a456-426614174000',
                    type: 'VOUCHER_REDEEMED',
                    title: 'Voucher Redeemed',
                    body: 'A customer has redeemed your discount voucher.',
                    icon: 'voucher',
                    entityRef: {
                      entityType: 'VOUCHER_REDEMPTION',
                      entityId: 'redeem123-e89b-12d3-a456-426614174000',
                    },
                  },
                },
                messageNotification: {
                  summary: 'Message notification',
                  value: {
                    userId: '789e0123-e45b-12d3-a456-426614174000',
                    type: 'MESSAGE_RECEIVED',
                    title: 'New Message',
                    body: 'You have received a new message from Carlos Rodriguez.',
                    icon: 'message',
                    entityRef: {
                      entityType: 'CONVERSATION',
                      entityId: 'conv456-e89b-12d3-a456-426614174000',
                    },
                  },
                },
                systemAnnouncement: {
                  summary: 'System announcement',
                  value: {
                    userId: '456e7890-e12b-12d3-a456-426614174000',
                    type: 'SYSTEM_ANNOUNCEMENT',
                    title: 'Maintenance Notice',
                    body: 'Our platform will undergo maintenance tomorrow from 2 AM to 4 AM.',
                    icon: 'system',
                    expiresAt: '2025-05-10T04:00:00Z',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Notification published successfully',
            content: {
              'application/json': {
                schema: registry.ref('PublishNotificationResponse'),
                examples: {
                  success: {
                    summary: 'Notification published',
                    value: {
                      success: true,
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '422': registry.refResponse('ValidationError'),
          '500': registry.refResponse('ServerError'),
        },
      },
    },
    '/api/v1/notifications/publish/batch': {
      post: {
        tags: ['Notifications'],
        operationId: 'batchPublishNotifications',
        summary: 'Batch publish notifications',
        description:
          'Create and send multiple notifications at once (internal service use)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('PublishBatchNotificationsRequest'),
              examples: {
                batchNotifications: {
                  summary: 'Multiple notifications',
                  value: {
                    notifications: [
                      {
                        userId: '456e7890-e12b-12d3-a456-426614174000',
                        type: 'VOUCHER_REDEEMED',
                        title: 'Voucher Redeemed',
                        body: 'A customer has redeemed your discount voucher.',
                        icon: 'voucher',
                        entityRef: {
                          entityType: 'VOUCHER_REDEMPTION',
                          entityId: 'redeem123-e89b-12d3-a456-426614174000',
                        },
                      },
                      {
                        userId: '789e0123-e45b-12d3-a456-426614174000',
                        type: 'VOUCHER_CLAIMED',
                        title: 'Voucher Claimed',
                        body: 'Your discount voucher has been claimed by a customer.',
                        icon: 'voucher',
                        entityRef: {
                          entityType: 'VOUCHER',
                          entityId: 'voucher123-e89b-12d3-a456-426614174000',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Batch notifications processed',
            content: {
              'application/json': {
                schema: registry.ref('PublishBatchNotificationsResponse'),
                examples: {
                  success: {
                    summary: 'Batch processed successfully',
                    value: {
                      success: true,
                      count: 2,
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '422': registry.refResponse('ValidationError'),
          '500': registry.refResponse('ServerError'),
        },
      },
    },
    '/api/v1/notifications/{notificationId}/read': {
      parameters: [registry.refParameter('notificationIdParam')],
      patch: {
        tags: ['Notifications'],
        operationId: 'markNotificationAsRead',
        summary: 'Mark notification as read',
        description:
          'Mark a specific notification as read for the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Notification marked as read successfully',
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description:
              'Notification does not belong to the authenticated user',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  notOwner: {
                    summary: 'Not notification owner',
                    value: {
                      status_code: 403,
                      error: 'Forbidden',
                      message:
                        'You can only mark your own notifications as read',
                      details: [],
                    },
                  },
                },
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '500': registry.refResponse('ServerError'),
        },
      },
    },
    '/api/v1/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        operationId: 'markAllNotificationsAsRead',
        summary: 'Mark all notifications as read',
        description:
          'Mark all notifications as read for the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'All notifications marked as read successfully',
          },
          '401': registry.refResponse('UnauthorizedError'),
          '500': registry.refResponse('ServerError'),
        },
      },
    },
    '/api/v1/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        operationId: 'getUnreadNotificationsCount',
        summary: 'Get unread notifications count',
        description:
          'Get the total count of unread notifications for the authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Unread count retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    unreadCount: {
                      type: 'integer',
                      minimum: 0,
                    },
                  },
                  required: ['unreadCount'],
                },
                examples: {
                  unreadCount: {
                    summary: 'Unread notifications count',
                    value: {
                      unreadCount: 5,
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '500': registry.refResponse('ServerError'),
        },
      },
    },
  },
}
