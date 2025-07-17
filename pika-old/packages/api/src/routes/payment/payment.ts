import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Payment routes
export const PaymentRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/payments': {
      get: {
        tags: ['Payments'],
        operationId: 'getPayments',
        summary: 'Get payments',
        description:
          'Retrieve a paginated list of payments for the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          registry.refParameter('paymentStatusParam'),
          registry.refParameter('paymentFromDateParam'),
          registry.refParameter('paymentToDateParam'),
          registry.refParameter('paginationPageParam'),
          registry.refParameter('paginationLimitParam'),
          registry.refParameter('sortParam'),
        ],
        responses: {
          '200': {
            description: 'Payments retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('PaymentListResponse'),
                examples: {
                  payments: {
                    summary: 'List of payments',
                    value: {
                      data: [
                        {
                          id: '123e4567-e89b-12d3-a456-426614174000',
                          bookingId: '234e5678-e90b-12d3-a456-426614174111',
                          customerId: '345e6789-e01b-12d3-a456-426614174222',
                          providerId: '456e7890-e12b-12d3-a456-426614174333',
                          paymentMethodId:
                            '567e8901-e23b-12d3-a456-426614174444',
                          amount: 250000,
                          status: 'COMPLETED',
                          paymentMethod: 'CREDIT_CARD',
                          currency: 'PYG',
                          transactionId: 'tx_12345',
                          gatewayResponse: {
                            id: 'payment_12345',
                            status: 'approved',
                          },
                          createdAt: '2025-05-05T14:30:00Z',
                          updatedAt: '2025-05-05T14:35:00Z',
                          completedAt: '2025-05-05T14:35:00Z',
                        },
                      ],
                      pagination: {
                        currentPage: 1,
                        totalPages: 3,
                        totalItems: 25,
                        itemsPerPage: 10,
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
    },
    '/api/v1/payments/{paymentId}': {
      parameters: [registry.refParameter('paymentIdParam')],
      get: {
        tags: ['Payments'],
        operationId: 'getPaymentById',
        summary: 'Get payment by ID',
        description: 'Retrieve detailed information about a payment',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Payment retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('Payment'),
                examples: {
                  payment: {
                    summary: 'Payment details',
                    value: {
                      id: '123e4567-e89b-12d3-a456-426614174000',
                      bookingId: '234e5678-e90b-12d3-a456-426614174111',
                      customerId: '345e6789-e01b-12d3-a456-426614174222',
                      providerId: '456e7890-e12b-12d3-a456-426614174333',
                      paymentMethodId: '567e8901-e23b-12d3-a456-426614174444',
                      amount: 250000,
                      status: 'COMPLETED',
                      paymentMethod: 'CREDIT_CARD',
                      currency: 'PYG',
                      transactionId: 'tx_12345',
                      gatewayResponse: {
                        id: 'payment_12345',
                        status: 'approved',
                      },
                      createdAt: '2025-05-05T14:30:00Z',
                      updatedAt: '2025-05-05T14:35:00Z',
                      completedAt: '2025-05-05T14:35:00Z',
                      booking: {
                        id: '234e5678-e90b-12d3-a456-426614174111',
                        serviceId: '789e0123-e45b-12d3-a456-426614174555',
                        bookingDate: '2025-05-15',
                        startTime: '14:00',
                        endTime: '15:00',
                        status: 'CONFIRMED',
                      },
                      customer: {
                        id: '345e6789-e01b-12d3-a456-426614174222',
                        firstName: 'Ana',
                        lastName: 'Gomez',
                      },
                      provider: {
                        id: '456e7890-e12b-12d3-a456-426614174333',
                        firstName: 'Carlos',
                        lastName: 'Rodriguez',
                      },
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not related to this payment',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
        },
      },
    },
    '/api/v1/payments/process': {
      post: {
        tags: ['Payments'],
        operationId: 'processPayment',
        summary: 'Process payment',
        description: 'Process a payment for a booking',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookingId', 'paymentMethodId'],
                properties: {
                  bookingId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the booking to pay for',
                  },
                  paymentMethodId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the payment method to use',
                  },
                },
              },
              examples: {
                processPayment: {
                  summary: 'Process payment for booking',
                  value: {
                    bookingId: '234e5678-e90b-12d3-a456-426614174111',
                    paymentMethodId: '567e8901-e23b-12d3-a456-426614174444',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment processed successfully',
            content: {
              'application/json': {
                schema: registry.ref('Payment'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not the customer of this booking',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '409': {
            description: 'Payment already processed or booking status invalid',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/payments/bancard/create': {
      post: {
        tags: ['Payments'],
        operationId: 'createBancardPayment',
        summary: 'Create Bancard payment',
        description: 'Create a new payment request via Bancard gateway',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookingId'],
                properties: {
                  bookingId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the booking to pay for',
                  },
                },
              },
              examples: {
                createBancardPayment: {
                  summary: 'Create Bancard payment request',
                  value: {
                    bookingId: '234e5678-e90b-12d3-a456-426614174111',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment request created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    processId: {
                      type: 'string',
                      description: 'Bancard process ID',
                    },
                    paymentUrl: {
                      type: 'string',
                      format: 'uri',
                      description:
                        'URL to redirect the user to complete the payment',
                    },
                  },
                },
                examples: {
                  bancardResponse: {
                    summary: 'Bancard payment response',
                    value: {
                      processId: 'bc_12345',
                      paymentUrl: 'https://vpos.infonet.com.py/payment/12345',
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not the customer of this booking',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '409': {
            description: 'Payment already processed or booking status invalid',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '422': registry.refResponse('ValidationError'),
          '500': registry.refResponse('ServerError'),
        },
      },
    },
    '/api/v1/payments/bancard/callback': {
      post: {
        tags: ['Payments'],
        operationId: 'bancardCallback',
        summary: 'Bancard callback',
        description:
          'Webhook endpoint for Bancard payment confirmations (internal use)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  operation: {
                    type: 'object',
                  },
                  data: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Callback processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['success'],
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid callback data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['error'],
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['error'],
                    },
                    message: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/payments/bancard/return': {
      get: {
        tags: ['Payments'],
        operationId: 'bancardReturn',
        summary: 'Bancard return',
        description:
          'Endpoint for users redirected back from Bancard payment portal',
        parameters: [
          {
            name: 'process_id',
            in: 'query',
            required: true,
            description: 'Bancard process ID',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'status',
            in: 'query',
            required: true,
            description: 'Payment status',
            schema: {
              type: 'string',
              enum: ['success', 'error'],
            },
          },
        ],
        responses: {
          '302': {
            description: 'Redirect to appropriate page in the frontend',
            headers: {
              Location: {
                schema: {
                  type: 'string',
                  format: 'uri',
                },
                description: 'URL to redirect the user to after payment',
              },
            },
          },
          '400': {
            description: 'Invalid return parameters',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '500': registry.refResponse('ServerError'),
        },
      },
    },
    '/api/v1/payments/{paymentId}/refund': {
      parameters: [registry.refParameter('paymentIdParam')],
      post: {
        tags: ['Payments'],
        operationId: 'refundPayment',
        summary: 'Refund payment',
        description: 'Process a refund for a completed payment (admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: {
                    type: 'number',
                    description:
                      'Refund amount (defaults to full payment amount if not specified)',
                  },
                  reason: {
                    type: 'string',
                    description: 'Reason for refund',
                  },
                },
              },
              examples: {
                fullRefund: {
                  summary: 'Full payment refund',
                  value: {
                    reason: 'Customer requested cancellation',
                  },
                },
                partialRefund: {
                  summary: 'Partial payment refund',
                  value: {
                    amount: 125000,
                    reason: 'Service partially completed',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Refund processed successfully',
            content: {
              'application/json': {
                schema: registry.ref('Payment'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to process refunds',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '409': {
            description: 'Payment already refunded or status invalid',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
  },
}
