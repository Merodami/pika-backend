import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// PDF routes
export const PDFRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/pdf/books': {
      get: {
        tags: ['PDF'],
        operationId: 'getVoucherBooks',
        summary: 'Get voucher books',
        description:
          'Retrieve a list of voucher books with pagination and filtering',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            schema: {
              type: 'integer',
              default: 1,
              minimum: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: {
              type: 'integer',
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by voucher book status',
            schema: {
              type: 'string',
              enum: ['DRAFT', 'READY_FOR_PRINT', 'PUBLISHED', 'ARCHIVED'],
            },
          },
          {
            name: 'book_type',
            in: 'query',
            description: 'Filter by book type',
            schema: {
              type: 'string',
              enum: [
                'MONTHLY',
                'SPECIAL_EDITION',
                'REGIONAL',
                'SEASONAL',
                'PROMOTIONAL',
              ],
            },
          },
          {
            name: 'year',
            in: 'query',
            description: 'Filter by year',
            schema: {
              type: 'integer',
              minimum: 2020,
            },
          },
          {
            name: 'month',
            in: 'query',
            description: 'Filter by month',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Voucher books retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: registry.ref('VoucherBook'),
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '500': registry.refResponse('ServerError'),
        },
      },
      post: {
        tags: ['PDF'],
        operationId: 'createVoucherBook',
        summary: 'Create a new voucher book',
        description: 'Create a new voucher book (admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('VoucherBookCreate'),
              examples: {
                newVoucherBook: {
                  summary: 'New voucher book',
                  value: {
                    title: 'January 2024 Voucher Book',
                    edition: 'Edition 1',
                    book_type: 'MONTHLY',
                    month: 1,
                    year: 2024,
                    total_pages: 24,
                    cover_image_url: 'https://example.com/covers/jan2024.jpg',
                    back_image_url:
                      'https://example.com/covers/jan2024-back.jpg',
                    metadata: {
                      theme: 'New Year Specials',
                      target_audience: 'General',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Voucher book created successfully',
            content: {
              'application/json': {
                schema: registry.ref('VoucherBook'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to create voucher books',
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
    '/api/v1/pdf/books/{bookId}': {
      parameters: [
        {
          name: 'bookId',
          in: 'path',
          required: true,
          description: 'Voucher book ID',
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      get: {
        tags: ['PDF'],
        operationId: 'getVoucherBookById',
        summary: 'Get voucher book by ID',
        description: 'Retrieve detailed information about a voucher book',
        responses: {
          '200': {
            description: 'Voucher book retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('VoucherBook'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '500': registry.refResponse('ServerError'),
        },
      },
      patch: {
        tags: ['PDF'],
        operationId: 'updateVoucherBook',
        summary: 'Update voucher book',
        description: 'Modify a voucher book (admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('VoucherBookUpdate'),
              examples: {
                updateVoucherBook: {
                  summary: 'Update voucher book',
                  value: {
                    title: 'February 2024 Special Edition',
                    edition: 'Valentine Special',
                    cover_image_url:
                      'https://example.com/covers/feb2024-valentine.jpg',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Voucher book updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('VoucherBook'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to update voucher books',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
      delete: {
        tags: ['PDF'],
        operationId: 'deleteVoucherBook',
        summary: 'Delete voucher book',
        description: 'Remove a voucher book (admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Voucher book deleted successfully',
          },
          '400': {
            description: 'Cannot delete published voucher book',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to delete voucher books',
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
    '/api/v1/pdf/books/{bookId}/status': {
      parameters: [
        {
          name: 'bookId',
          in: 'path',
          required: true,
          description: 'Voucher book ID',
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      patch: {
        tags: ['PDF'],
        operationId: 'updateVoucherBookStatus',
        summary: 'Update voucher book status',
        description: 'Change the status of a voucher book (admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['DRAFT', 'READY_FOR_PRINT', 'PUBLISHED', 'ARCHIVED'],
                  },
                  pdf_url: {
                    type: 'string',
                    format: 'uri',
                    description: 'Required when publishing the book',
                  },
                },
              },
              examples: {
                publishBook: {
                  summary: 'Publish voucher book',
                  value: {
                    status: 'PUBLISHED',
                    pdf_url: 'https://example.com/books/jan2024.pdf',
                  },
                },
                readyForPrint: {
                  summary: 'Mark ready for print',
                  value: {
                    status: 'READY_FOR_PRINT',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Voucher book status updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('VoucherBook'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to update voucher book status',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
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
