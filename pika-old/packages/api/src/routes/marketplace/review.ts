import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Review routes
export const ReviewRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/reviews': {
      get: {
        tags: ['Reviews'],
        operationId: 'getReviews',
        summary: 'Get reviews',
        description:
          'Retrieve a paginated list of reviews with optional filtering',
        parameters: [
          registry.refParameter('providerIdParam'),
          registry.refParameter('customerIdParam'),
          registry.refParameter('reviewRatingParam'),
          registry.refParameter('paginationPageParam'),
          registry.refParameter('paginationLimitParam'),
          registry.refParameter('sortParam'),
        ],
        responses: {
          '200': {
            description: 'Reviews retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('ReviewListResponse'),
                examples: {
                  reviews: {
                    summary: 'List of reviews',
                    value: {
                      data: [
                        {
                          id: '123e4567-e89b-12d3-a456-426614174000',
                          customerId: '345e6789-e01b-12d3-a456-426614174222',
                          providerId: '456e7890-e12b-12d3-a456-426614174333',
                          rating: 5,
                          comment:
                            'Excellent service, arrived on time and fixed the issue quickly',
                          response: 'Thank you for your kind review!',
                          createdAt: '2025-05-01T14:30:00Z',
                          updatedAt: '2025-05-02T09:15:00Z',
                          customer: {
                            id: '345e6789-e01b-12d3-a456-426614174222',
                            firstName: 'Ana',
                            lastName: 'Gomez',
                            avatarUrl:
                              'https://api.servicemarketplace.py/avatars/345e6789.jpg',
                          },
                          provider: {
                            id: '456e7890-e12b-12d3-a456-426614174333',
                            firstName: 'Carlos',
                            lastName: 'Rodriguez',
                            avatarUrl:
                              'https://api.servicemarketplace.py/avatars/456e7890.jpg',
                          },
                        },
                      ],
                      pagination: {
                        currentPage: 1,
                        totalPages: 10,
                        totalItems: 98,
                        itemsPerPage: 10,
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
        tags: ['Reviews'],
        operationId: 'createReview',
        summary: 'Create a new review',
        description: 'Submit a review for a provider',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('ReviewCreate'),
              examples: {
                newReview: {
                  summary: 'New review',
                  value: {
                    providerId: '456e7890-e12b-12d3-a456-426614174333',
                    rating: 5,
                    comment:
                      'Excellent service, arrived on time and fixed the issue quickly',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Review created successfully',
            content: {
              'application/json': {
                schema: registry.ref('Review'),
                examples: {
                  createdReview: {
                    summary: 'Created review',
                    value: {
                      id: '123e4567-e89b-12d3-a456-426614174000',
                      customerId: '345e6789-e01b-12d3-a456-426614174222',
                      providerId: '456e7890-e12b-12d3-a456-426614174333',
                      rating: 5,
                      comment:
                        'Excellent service, arrived on time and fixed the issue quickly',
                      createdAt: '2025-05-07T15:45:00Z',
                      updatedAt: '2025-05-07T15:45:00Z',
                      customer: {
                        id: '345e6789-e01b-12d3-a456-426614174222',
                        firstName: 'Ana',
                        lastName: 'Gomez',
                        avatarUrl:
                          'https://api.servicemarketplace.py/avatars/345e6789.jpg',
                      },
                      provider: {
                        id: '456e7890-e12b-12d3-a456-426614174333',
                        firstName: 'Carlos',
                        lastName: 'Rodriguez',
                        avatarUrl:
                          'https://api.servicemarketplace.py/avatars/456e7890.jpg',
                      },
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to review this provider',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  notCustomer: {
                    summary: 'Not the customer',
                    value: {
                      status_code: 403,
                      error: 'Forbidden',
                      message:
                        'Only customers who have used services from this provider can leave a review',
                      details: [],
                    },
                  },
                },
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '409': {
            description: 'Review already exists or provider not used',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  reviewExists: {
                    summary: 'Review already exists',
                    value: {
                      status_code: 409,
                      error: 'Conflict',
                      message: 'A review for this provider already exists',
                      details: [],
                    },
                  },
                  serviceNotUsed: {
                    summary: 'Provider not used',
                    value: {
                      status_code: 409,
                      error: 'Conflict',
                      message:
                        'Cannot review a provider without having used their services',
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
    '/api/v1/reviews/{reviewId}': {
      parameters: [registry.refParameter('reviewIdParam')],
      get: {
        tags: ['Reviews'],
        operationId: 'getReviewById',
        summary: 'Get review by ID',
        description: 'Retrieve detailed information about a review',
        responses: {
          '200': {
            description: 'Review retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('Review'),
                examples: {
                  review: {
                    summary: 'Review details',
                    value: {
                      id: '123e4567-e89b-12d3-a456-426614174000',
                      customerId: '345e6789-e01b-12d3-a456-426614174222',
                      providerId: '456e7890-e12b-12d3-a456-426614174333',
                      rating: 5,
                      comment:
                        'Excellent service, arrived on time and fixed the issue quickly',
                      response: 'Thank you for your kind review!',
                      createdAt: '2025-05-01T14:30:00Z',
                      updatedAt: '2025-05-02T09:15:00Z',
                      customer: {
                        id: '345e6789-e01b-12d3-a456-426614174222',
                        firstName: 'Ana',
                        lastName: 'Gomez',
                        avatarUrl:
                          'https://api.servicemarketplace.py/avatars/345e6789.jpg',
                      },
                      provider: {
                        id: '456e7890-e12b-12d3-a456-426614174333',
                        firstName: 'Carlos',
                        lastName: 'Rodriguez',
                        avatarUrl:
                          'https://api.servicemarketplace.py/avatars/456e7890.jpg',
                      },
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
      patch: {
        tags: ['Reviews'],
        operationId: 'updateReviewResponse',
        summary: 'Update review response',
        description: 'Add or update the provider response to a review',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['response'],
                properties: {
                  response: {
                    type: 'string',
                    maxLength: 1000,
                  },
                },
              },
              examples: {
                addResponse: {
                  summary: 'Add response to review',
                  value: {
                    response:
                      'Thank you for your kind review! We strive to provide excellent service to all our customers.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Review response updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('Review'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not the owner of this provider account',
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
        tags: ['Reviews'],
        operationId: 'deleteReview',
        summary: 'Delete review',
        description: 'Remove a review (admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Review deleted successfully',
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to delete reviews',
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
  },
}
