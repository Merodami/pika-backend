import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Messaging routes
export const MessagingRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/conversations': {
      get: {
        tags: ['Messaging'],
        operationId: 'getConversations',
        summary: 'Get user conversations',
        description:
          'Retrieve a paginated list of conversations for the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          registry.refParameter('conversationsLimitParam'),
          registry.refParameter('conversationsOffsetParam'),
          registry.refParameter('includeArchivedParam'),
        ],
        responses: {
          '200': {
            description: 'Conversations retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('GetConversationsResponse'),
                examples: {
                  conversations: {
                    summary: 'List of user conversations',
                    value: {
                      conversations: [
                        {
                          id: '123e4567-e89b-12d3-a456-426614174000',
                          participants: [
                            {
                              userId: '456e7890-e12b-12d3-a456-426614174000',
                              userType: 'PROVIDER',
                              joinedAt: '2025-05-01T10:00:00Z',
                              isArchived: false,
                              isBlocked: false,
                              isMuted: false,
                              unreadCount: 2,
                            },
                            {
                              userId: '789e0123-e45b-12d3-a456-426614174000',
                              userType: 'CUSTOMER',
                              joinedAt: '2025-05-01T10:00:00Z',
                              lastReadAt: '2025-05-07T14:30:00Z',
                              lastReadMessageId:
                                'abc12345-e89b-12d3-a456-426614174000',
                              isArchived: false,
                              isBlocked: false,
                              isMuted: false,
                              unreadCount: 0,
                            },
                          ],
                          lastMessage: {
                            id: 'def67890-e89b-12d3-a456-426614174000',
                            content:
                              'Hello! I would like to book your plumbing service.',
                            senderId: '456e7890-e12b-12d3-a456-426614174000',
                            sentAt: '2025-05-07T15:00:00Z',
                            type: 'TEXT',
                          },
                          context: {
                            type: 'VOUCHER_INQUIRY',
                            id: 'voucher123-e89b-12d3-a456-426614174000',
                          },
                          createdAt: '2025-05-01T10:00:00Z',
                          updatedAt: '2025-05-07T15:00:00Z',
                        },
                      ],
                      pagination: {
                        total: 5,
                        limit: 20,
                        offset: 0,
                        hasMore: false,
                      },
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
      post: {
        tags: ['Messaging'],
        operationId: 'createConversation',
        summary: 'Create a new conversation',
        description: 'Start a new conversation with another user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('CreateConversationRequest'),
              examples: {
                voucherConversation: {
                  summary: 'Voucher-related conversation',
                  value: {
                    participantIds: [
                      '456e7890-e12b-12d3-a456-426614174000',
                      '789e0123-e45b-12d3-a456-426614174000',
                    ],
                    context: {
                      type: 'VOUCHER_INQUIRY',
                      id: 'voucher123-e89b-12d3-a456-426614174000',
                    },
                  },
                },
                generalConversation: {
                  summary: 'General conversation',
                  value: {
                    participantIds: [
                      '456e7890-e12b-12d3-a456-426614174000',
                      '789e0123-e45b-12d3-a456-426614174000',
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Conversation created successfully',
            content: {
              'application/json': {
                schema: registry.ref('CreateConversationResponse'),
                examples: {
                  success: {
                    summary: 'Conversation created',
                    value: {
                      conversationId: '123e4567-e89b-12d3-a456-426614174000',
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '409': {
            description: 'Conversation already exists',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  conversationExists: {
                    summary: 'Conversation already exists',
                    value: {
                      status_code: 409,
                      error: 'Conflict',
                      message:
                        'A conversation already exists between these participants',
                      details: [],
                    },
                  },
                },
              },
            },
          },
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/conversations/{conversationId}/messages': {
      parameters: [registry.refParameter('conversationIdParam')],
      get: {
        tags: ['Messaging'],
        operationId: 'getMessages',
        summary: 'Get conversation messages',
        description:
          'Retrieve messages from a specific conversation with pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          registry.refParameter('messagesLimitParam'),
          registry.refParameter('messagesBeforeParam'),
          registry.refParameter('messagesAfterParam'),
        ],
        responses: {
          '200': {
            description: 'Messages retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('GetMessagesResponse'),
                examples: {
                  messages: {
                    summary: 'List of conversation messages',
                    value: {
                      messages: [
                        {
                          id: 'msg123-e89b-12d3-a456-426614174000',
                          conversationId:
                            '123e4567-e89b-12d3-a456-426614174000',
                          senderId: '456e7890-e12b-12d3-a456-426614174000',
                          senderType: 'CUSTOMER',
                          type: 'TEXT',
                          content:
                            'Hello! I would like to book your plumbing service.',
                          status: {
                            sent: '2025-05-07T15:00:00Z',
                            delivered: '2025-05-07T15:00:05Z',
                            read: '2025-05-07T15:05:00Z',
                          },
                          createdAt: '2025-05-07T15:00:00Z',
                          updatedAt: '2025-05-07T15:05:00Z',
                        },
                        {
                          id: 'msg456-e89b-12d3-a456-426614174000',
                          conversationId:
                            '123e4567-e89b-12d3-a456-426614174000',
                          senderId: '789e0123-e45b-12d3-a456-426614174000',
                          senderType: 'PROVIDER',
                          type: 'TEXT',
                          content:
                            "Hi! I'd be happy to help with your plumbing needs. When would be convenient for you?",
                          status: {
                            sent: '2025-05-07T15:10:00Z',
                            delivered: '2025-05-07T15:10:02Z',
                          },
                          createdAt: '2025-05-07T15:10:00Z',
                          updatedAt: '2025-05-07T15:10:02Z',
                        },
                      ],
                      pagination: {
                        limit: 20,
                        hasMore: false,
                      },
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not a participant in this conversation',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  notParticipant: {
                    summary: 'User is not a participant',
                    value: {
                      status_code: 403,
                      error: 'Forbidden',
                      message: 'You are not a participant in this conversation',
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
      post: {
        tags: ['Messaging'],
        operationId: 'sendMessage',
        summary: 'Send a message',
        description: 'Send a new message in a conversation',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('SendMessageRequest'),
              examples: {
                textMessage: {
                  summary: 'Text message',
                  value: {
                    type: 'TEXT',
                    content:
                      'Hello! I would like to book your plumbing service.',
                  },
                },
                replyMessage: {
                  summary: 'Reply to a message',
                  value: {
                    type: 'TEXT',
                    content: 'I can be available tomorrow at 2 PM.',
                    replyToId: 'msg123-e89b-12d3-a456-426614174000',
                  },
                },
                imageMessage: {
                  summary: 'Image message',
                  value: {
                    type: 'IMAGE',
                    content: 'Here is the photo of the issue',
                    metadata: {
                      fileName: 'plumbing_issue.jpg',
                      fileSize: 1024000,
                      fileUrl: 'https://api.pika.help/files/image123.jpg',
                      thumbnailUrl:
                        'https://api.pika.help/files/image123_thumb.jpg',
                      mimeType: 'image/jpeg',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Message sent successfully',
            content: {
              'application/json': {
                schema: registry.ref('SendMessageResponse'),
                examples: {
                  success: {
                    summary: 'Message sent',
                    value: {
                      messageId: 'msg789-e89b-12d3-a456-426614174000',
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Conversation is blocked or user is not a participant',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  blocked: {
                    summary: 'Conversation is blocked',
                    value: {
                      status_code: 403,
                      error: 'Forbidden',
                      message: 'Cannot send message to blocked conversation',
                      details: [],
                    },
                  },
                },
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/conversations/{conversationId}/read': {
      parameters: [registry.refParameter('conversationIdParam')],
      patch: {
        tags: ['Messaging'],
        operationId: 'markMessagesAsRead',
        summary: 'Mark messages as read',
        description: 'Mark one or more messages as read in a conversation',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('MarkMessagesReadRequest'),
              examples: {
                markRead: {
                  summary: 'Mark messages as read',
                  value: {
                    messageIds: [
                      'msg123-e89b-12d3-a456-426614174000',
                      'msg456-e89b-12d3-a456-426614174000',
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Messages marked as read successfully',
            content: {
              'application/json': {
                schema: registry.ref('MarkMessagesReadResponse'),
                examples: {
                  success: {
                    summary: 'Messages marked as read',
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
          '403': {
            description: 'Not a participant in this conversation',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  notParticipant: {
                    summary: 'User is not a participant',
                    value: {
                      status_code: 403,
                      error: 'Forbidden',
                      message: 'You are not a participant in this conversation',
                      details: [],
                    },
                  },
                },
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
  },
}
