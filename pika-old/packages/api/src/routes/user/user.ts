import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// User routes
export const UserRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/users/me': {
      get: {
        tags: ['Users'],
        operationId: 'getCurrentUser',
        summary: 'Get current user profile',
        description: 'Retrieve the profile of the currently authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('UserProfile'),
                examples: {
                  customer: {
                    summary: 'Customer profile',
                    value: {
                      id: '123e4567-e89b-12d3-a456-426614174000',
                      email: 'customer@example.com',
                      emailVerified: true,
                      firstName: 'Juan',
                      lastName: 'Perez',
                      phoneNumber: '+595981123456',
                      phoneVerified: true,
                      avatarUrl:
                        'https://api.servicemarketplace.py/avatars/123e4567.jpg',
                      role: 'CUSTOMER',
                      status: 'ACTIVE',
                      lastLoginAt: '2025-05-07T12:30:00Z',
                      createdAt: '2025-04-10T09:00:00Z',
                      updatedAt: '2025-05-07T12:30:00Z',
                      addresses: [
                        {
                          id: '234e5678-e90b-12d3-a456-426614174111',
                          userId: '123e4567-e89b-12d3-a456-426614174000',
                          label: 'Casa',
                          street: 'Av. Mariscal López',
                          number: '1234',
                          neighborhood: 'Villa Morra',
                          city: 'Asunción',
                          state: 'Asunción',
                          country: 'Paraguay',
                          postalCode: '1234',
                          notes: 'Casa con portón negro',
                          latitude: -25.282021,
                          longitude: -57.635021,
                          isDefault: true,
                          createdAt: '2025-04-10T09:15:00Z',
                          updatedAt: '2025-04-10T09:15:00Z',
                        },
                      ],
                      paymentMethods: [
                        {
                          id: '345e6789-e01b-12d3-a456-426614174222',
                          userId: '123e4567-e89b-12d3-a456-426614174000',
                          type: 'CREDIT_CARD',
                          cardBrand: 'Visa',
                          last4: '4242',
                          expiryMonth: 12,
                          expiryYear: 2027,
                          isDefault: true,
                          createdAt: '2025-04-10T09:30:00Z',
                          updatedAt: '2025-04-10T09:30:00Z',
                        },
                      ],
                    },
                  },
                  provider: {
                    summary: 'Provider profile',
                    value: {
                      id: '456e7890-e12b-12d3-a456-426614174333',
                      email: 'provider@example.com',
                      emailVerified: true,
                      firstName: 'Carlos',
                      lastName: 'Rodriguez',
                      phoneNumber: '+595981234567',
                      phoneVerified: true,
                      avatarUrl:
                        'https://api.servicemarketplace.py/avatars/456e7890.jpg',
                      role: 'PROVIDER',
                      status: 'ACTIVE',
                      lastLoginAt: '2025-05-07T11:15:00Z',
                      createdAt: '2025-04-05T14:00:00Z',
                      updatedAt: '2025-05-07T11:15:00Z',
                      addresses: [
                        {
                          id: '567e8901-e23b-12d3-a456-426614174444',
                          userId: '456e7890-e12b-12d3-a456-426614174333',
                          label: 'Oficina',
                          street: 'Calle Colón',
                          number: '567',
                          neighborhood: 'Centro',
                          city: 'Asunción',
                          state: 'Asunción',
                          country: 'Paraguay',
                          postalCode: '5678',
                          latitude: -25.284565,
                          longitude: -57.631035,
                          isDefault: true,
                          createdAt: '2025-04-05T14:15:00Z',
                          updatedAt: '2025-04-05T14:15:00Z',
                        },
                      ],
                      providerProfile: {
                        id: '678e9012-e34b-12d3-a456-426614174555',
                        userId: '456e7890-e12b-12d3-a456-426614174333',
                        businessName: {
                          es: 'Plomería Carlos',
                          en: 'Carlos Plumbing',
                          gn: 'Carlos Yta mbohyapy',
                        },
                        businessDescription: {
                          es: 'Servicios profesionales de plomería con más de 10 años de experiencia',
                          en: 'Professional plumbing services with over 10 years of experience',
                          gn: "Yta mbohyapy mba'apokuéra iñexperiencia 10 ary",
                        },
                        categoryId: '234e5678-e90b-12d3-a456-426614174111',
                        verified: true,
                        active: true,
                        avgRating: 4.9,
                        createdAt: '2025-04-05T14:30:00Z',
                        updatedAt: '2025-05-01T10:00:00Z',
                      },
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
      patch: {
        tags: ['Users'],
        operationId: 'updateCurrentUser',
        summary: 'Update current user profile',
        description: 'Modify the profile of the currently authenticated user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('UserProfileUpdate'),
              examples: {
                update: {
                  summary: 'Update user profile',
                  value: {
                    firstName: 'Juan Carlos',
                    lastName: 'Perez',
                    phoneNumber: '+595981987654',
                  },
                },
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phoneNumber: { type: 'string' },
                  avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'User avatar image',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User profile updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('UserProfile'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/users/me/addresses': {
      get: {
        tags: ['Users'],
        operationId: 'getUserAddresses',
        summary: 'Get user addresses',
        description: 'Retrieve addresses for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Addresses retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: registry.ref('Address'),
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
        },
      },
      post: {
        tags: ['Users'],
        operationId: 'createUserAddress',
        summary: 'Create a new address',
        description: 'Add a new address for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('AddressCreate'),
              examples: {
                newAddress: {
                  summary: 'New address',
                  value: {
                    label: 'Trabajo',
                    street: 'Av. España',
                    number: '987',
                    neighborhood: 'Sajonia',
                    city: 'Asunción',
                    state: 'Asunción',
                    country: 'Paraguay',
                    postalCode: '4321',
                    notes: 'Edificio de oficinas, piso 3',
                    latitude: -25.280123,
                    longitude: -57.640456,
                    isDefault: false,
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Address created successfully',
            content: {
              'application/json': {
                schema: registry.ref('Address'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/users/me/addresses/{addressId}': {
      parameters: [registry.refParameter('addressIdParam')],
      get: {
        tags: ['Users'],
        operationId: 'getUserAddressById',
        summary: 'Get address by ID',
        description:
          'Retrieve a specific address for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Address retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('Address'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
      patch: {
        tags: ['Users'],
        operationId: 'updateUserAddress',
        summary: 'Update address',
        description:
          'Modify an existing address for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('AddressUpdate'),
              examples: {
                updateAddress: {
                  summary: 'Update address',
                  value: {
                    street: 'Av. España',
                    number: '654',
                    notes: 'Edificio de oficinas, piso 5',
                    isDefault: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Address updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('Address'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
      delete: {
        tags: ['Users'],
        operationId: 'deleteUserAddress',
        summary: 'Delete address',
        description: 'Remove an address for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Address deleted successfully',
          },
          '400': {
            description: 'Cannot delete default address',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
    },
    '/api/v1/users/me/payment-methods': {
      get: {
        tags: ['Users'],
        operationId: 'getUserPaymentMethods',
        summary: 'Get user payment methods',
        description:
          'Retrieve payment methods for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Payment methods retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: registry.ref('PaymentMethod'),
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
        },
      },
      post: {
        tags: ['Users'],
        operationId: 'createUserPaymentMethod',
        summary: 'Create a new payment method',
        description:
          'Add a new payment method for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('PaymentMethodCreate'),
              examples: {
                newPaymentMethod: {
                  summary: 'New credit card',
                  value: {
                    type: 'CREDIT_CARD',
                    cardToken: 'tok_visa_123456',
                    isDefault: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Payment method created successfully',
            content: {
              'application/json': {
                schema: registry.ref('PaymentMethod'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/users/me/payment-methods/{paymentMethodId}': {
      parameters: [registry.refParameter('paymentMethodIdParam')],
      get: {
        tags: ['Users'],
        operationId: 'getUserPaymentMethodById',
        summary: 'Get payment method by ID',
        description:
          'Retrieve a specific payment method for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Payment method retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('PaymentMethod'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
      patch: {
        tags: ['Users'],
        operationId: 'updateUserPaymentMethod',
        summary: 'Update payment method',
        description:
          'Modify an existing payment method for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('PaymentMethodUpdate'),
              examples: {
                setDefault: {
                  summary: 'Set as default payment method',
                  value: {
                    isDefault: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment method updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('PaymentMethod'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
      delete: {
        tags: ['Users'],
        operationId: 'deleteUserPaymentMethod',
        summary: 'Delete payment method',
        description:
          'Remove a payment method for the currently authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Payment method deleted successfully',
          },
          '400': {
            description: 'Cannot delete default payment method',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
    },
  },
}
