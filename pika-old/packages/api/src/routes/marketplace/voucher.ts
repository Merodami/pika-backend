import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Voucher routes
export const VoucherRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/vouchers': {
      get: {
        tags: ['Vouchers'],
        operationId: 'getVouchers',
        summary: 'Get vouchers',
        description: 'Retrieve a list of vouchers with multilingual support',
        parameters: [
          registry.refParameter('voucherProviderIdParam'),
          registry.refParameter('voucherCategoryIdParam'),
          registry.refParameter('voucherStateParam'),
          registry.refParameter('voucherDiscountTypeParam'),
          registry.refParameter('paginationPageParam'),
          registry.refParameter('paginationLimitParam'),
          registry.refParameter('acceptLanguageParam'),
        ],
        responses: {
          '200': {
            description: 'Vouchers retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: registry.ref('Voucher'),
                    },
                    pagination: registry.ref('PaginationMetadata'),
                  },
                },
                examples: {
                  vouchers: {
                    summary: 'List of vouchers',
                    value: {
                      data: [
                        {
                          id: '123e4567-e89b-12d3-a456-426614174000',
                          provider_id: '456e7890-e12b-34d5-a678-426614174111',
                          category_id: '789e0123-e45b-67d8-a901-426614174222',
                          state: 'PUBLISHED',
                          title: {
                            es: 'Descuento 20%',
                            en: '20% Discount',
                            gn: '20% Descuento',
                          },
                          description: {
                            es: 'Obtén 20% de descuento en tu próxima compra',
                            en: 'Get 20% off your next purchase',
                            gn: '20% descuento próxima compra-pe',
                          },
                          discount_type: 'PERCENTAGE',
                          discount_value: '20.00',
                          currency: 'PYG',
                          valid_from: '2025-01-01T00:00:00Z',
                          expires_at: '2025-12-31T23:59:59Z',
                          max_redemptions: 100,
                          max_redemptions_per_user: 1,
                          current_redemptions: 15,
                          created_at: '2025-01-01T10:00:00Z',
                          updated_at: '2025-01-01T10:00:00Z',
                        },
                      ],
                      pagination: {
                        total: 1,
                        page: 1,
                        limit: 20,
                        pages: 1,
                        has_next: false,
                        has_prev: false,
                      },
                    },
                  },
                },
              },
            },
          },
          '500': registry.refResponse('ServerError'),
        },
      },
      post: {
        tags: ['Vouchers'],
        operationId: 'createVoucher',
        summary: 'Create a new voucher',
        description: 'Add a new voucher (admin/retailer only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('VoucherCreate'),
              examples: {
                newVoucher: {
                  summary: 'New voucher',
                  value: {
                    provider_id: '456e7890-e12b-34d5-a678-426614174111',
                    category_id: '789e0123-e45b-67d8-a901-426614174222',
                    title: {
                      es: 'Descuento Especial',
                      en: 'Special Discount',
                      gn: 'Descuento Especial',
                    },
                    description: {
                      es: 'Descuento especial para clientes',
                      en: 'Special discount for customers',
                      gn: 'Descuento especial cliente kuérape',
                    },
                    terms: {
                      es: 'Válido hasta fecha de vencimiento',
                      en: 'Valid until expiration date',
                      gn: 'Válido vencimiento peve',
                    },
                    discount_type: 'PERCENTAGE',
                    discount_value: 15,
                    currency: 'PYG',
                    valid_from: '2025-01-01T00:00:00Z',
                    expires_at: '2025-12-31T23:59:59Z',
                    max_redemptions: 50,
                    max_redemptions_per_user: 1,
                    code_config: {
                      generate_qr: true,
                      generate_short_code: true,
                      generate_static_code: false,
                    },
                  },
                },
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['voucher'],
                properties: {
                  voucher: registry.ref('VoucherCreate'),
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Voucher image',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Voucher created successfully',
            content: {
              'application/json': {
                schema: registry.ref('Voucher'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to create vouchers',
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
    '/api/v1/vouchers/{voucherId}': {
      parameters: [registry.refParameter('voucherIdParam')],
      get: {
        tags: ['Vouchers'],
        operationId: 'getVoucherById',
        summary: 'Get voucher by ID',
        description: 'Retrieve detailed information about a voucher',
        parameters: [
          {
            name: 'include_codes',
            in: 'query',
            description: 'Include voucher codes in response',
            schema: {
              type: 'boolean',
              default: false,
            },
          },
          registry.refParameter('acceptLanguageParam'),
        ],
        responses: {
          '200': {
            description: 'Voucher retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('Voucher'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '500': registry.refResponse('ServerError'),
        },
      },
      put: {
        tags: ['Vouchers'],
        operationId: 'updateVoucher',
        summary: 'Update voucher',
        description: 'Modify a voucher (admin/retailer only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('VoucherUpdate'),
              examples: {
                updateVoucher: {
                  summary: 'Update voucher discount',
                  value: {
                    title: {
                      es: 'Descuento Actualizado',
                      en: 'Updated Discount',
                      gn: 'Descuento Actualizado',
                    },
                    discount_value: 25,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Voucher updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('Voucher'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to update vouchers',
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
        tags: ['Vouchers'],
        operationId: 'deleteVoucher',
        summary: 'Delete voucher',
        description: 'Remove a voucher (admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Voucher deleted successfully',
          },
          '400': {
            description: 'Voucher has been redeemed and cannot be deleted',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to delete vouchers',
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
    '/api/v1/vouchers/{voucherId}/publish': {
      parameters: [registry.refParameter('voucherIdParam')],
      post: {
        tags: ['Vouchers'],
        operationId: 'publishVoucher',
        summary: 'Publish voucher',
        description: 'Publish a voucher to make it available to customers',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Voucher published successfully',
            content: {
              'application/json': {
                schema: registry.ref('Voucher'),
              },
            },
          },
          '400': {
            description: 'Voucher cannot be published in current state',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': registry.refResponse('ForbiddenError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
    },
    '/api/v1/vouchers/{voucherId}/expire': {
      parameters: [registry.refParameter('voucherIdParam')],
      post: {
        tags: ['Vouchers'],
        operationId: 'expireVoucher',
        summary: 'Expire voucher',
        description: 'Mark a voucher as expired',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Voucher expired successfully',
            content: {
              'application/json': {
                schema: registry.ref('Voucher'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': registry.refResponse('ForbiddenError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
    },
    '/api/v1/vouchers/{voucherId}/redeem': {
      parameters: [registry.refParameter('voucherIdParam')],
      post: {
        tags: ['Vouchers'],
        operationId: 'redeemVoucher',
        summary: 'Redeem voucher',
        description: 'Redeem a voucher (retailer validates customer code)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('VoucherRedeem'),
              examples: {
                redeemVoucher: {
                  summary: 'Redeem voucher with code',
                  value: {
                    code: 'SAVE-A1B2',
                    location: {
                      type: 'Point',
                      coordinates: [-57.6309, -25.2867],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Voucher redeemed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    voucher_id: { type: 'string' },
                    redeemed_at: { type: 'string', format: 'date-time' },
                    discount_applied: { type: 'number' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid voucher code or voucher cannot be redeemed',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': registry.refResponse('ForbiddenError'),
          '404': registry.refResponse('NotFoundError'),
          '409': {
            description: 'Voucher already redeemed by user',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
        },
      },
    },
    '/api/v1/vouchers/mine': {
      get: {
        tags: ['Vouchers'],
        operationId: 'getMyVouchers',
        summary: 'Get my vouchers',
        description: 'Get vouchers created by retailer or claimed by customer',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'role',
            in: 'query',
            description: 'Filter by role (retailer or customer)',
            schema: {
              type: 'string',
              enum: ['retailer', 'customer'],
            },
          },
          registry.refParameter('voucherStateParam'),
          registry.refParameter('paginationPageParam'),
          registry.refParameter('paginationLimitParam'),
          registry.refParameter('acceptLanguageParam'),
        ],
        responses: {
          '200': {
            description: 'Vouchers retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: registry.ref('Voucher'),
                    },
                    pagination: registry.ref('PaginationMetadata'),
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
