import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Category routes
export const CategoryRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/categories': {
      get: {
        tags: ['Categories'],
        operationId: 'getCategories',
        summary: 'Get categories',
        description:
          'Retrieve a list of service categories with multilingual support',
        parameters: [
          registry.refParameter('categoryParentIdParam'),
          registry.refParameter('categoryIncludeChildrenParam'),
          registry.refParameter('acceptLanguageParam'),
        ],
        responses: {
          '200': {
            description: 'Categories retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: registry.ref('Category'),
                    },
                  },
                },
                examples: {
                  categories: {
                    summary: 'List of categories',
                    value: {
                      data: [
                        {
                          id: '123e4567-e89b-12d3-a456-426614174000',
                          parentId: null,
                          name: {
                            es: 'Hogar',
                            en: 'Home',
                            gn: 'Óga',
                          },
                          description: {
                            es: 'Servicios para el hogar',
                            en: 'Home services',
                            gn: "Óga mba'apokuéra",
                          },
                          iconUrl:
                            'https://api.servicemarketplace.py/icons/home.svg',
                          active: true,
                          sortOrder: 1,
                          createdAt: '2025-04-01T10:00:00Z',
                          updatedAt: '2025-04-01T10:00:00Z',
                          children: [
                            {
                              id: '234e5678-e90b-12d3-a456-426614174111',
                              parentId: '123e4567-e89b-12d3-a456-426614174000',
                              name: {
                                es: 'Plomería',
                                en: 'Plumbing',
                                gn: 'Yta mbohyapy',
                              },
                              description: {
                                es: 'Servicios de plomería y fontanería',
                                en: 'Plumbing services',
                                gn: "Yta mbohyapy mba'apokuéra",
                              },
                              iconUrl:
                                'https://api.servicemarketplace.py/icons/plumbing.svg',
                              active: true,
                              sortOrder: 1,
                              createdAt: '2025-04-01T10:00:00Z',
                              updatedAt: '2025-04-01T10:00:00Z',
                              children: [],
                            },
                          ],
                        },
                        {
                          id: '345e6789-e01b-12d3-a456-426614174222',
                          parentId: null,
                          name: {
                            es: 'Jardín',
                            en: 'Garden',
                            gn: 'Korapý',
                          },
                          description: {
                            es: 'Servicios de jardinería y exterior',
                            en: 'Gardening and outdoor services',
                            gn: "Korapý mba'apokuéra",
                          },
                          iconUrl:
                            'https://api.servicemarketplace.py/icons/garden.svg',
                          active: true,
                          sortOrder: 2,
                          createdAt: '2025-04-01T10:00:00Z',
                          updatedAt: '2025-04-01T10:00:00Z',
                          children: [],
                        },
                      ],
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
        tags: ['Categories'],
        operationId: 'createCategory',
        summary: 'Create a new category',
        description: 'Add a new service category (admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('CategoryCreate'),
              examples: {
                newCategory: {
                  summary: 'New category',
                  value: {
                    parentId: '123e4567-e89b-12d3-a456-426614174000',
                    name: {
                      es: 'Electricidad',
                      en: 'Electrical',
                      gn: "Tataendy mba'e",
                    },
                    description: {
                      es: 'Servicios de electricidad',
                      en: 'Electrical services',
                      gn: "Tataendy mba'e mba'apokuéra",
                    },
                    iconUrl:
                      'https://api.servicemarketplace.py/icons/electrical.svg',
                    active: true,
                    sortOrder: 2,
                  },
                },
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['category'],
                properties: {
                  category: registry.ref('CategoryCreate'),
                  icon: {
                    type: 'string',
                    format: 'binary',
                    description: 'Category icon',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Category created successfully',
            content: {
              'application/json': {
                schema: registry.ref('Category'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to create categories',
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
    '/api/v1/categories/{categoryId}': {
      parameters: [registry.refParameter('categoryIdParam')],
      get: {
        tags: ['Categories'],
        operationId: 'getCategoryById',
        summary: 'Get category by ID',
        description: 'Retrieve detailed information about a category',
        parameters: [
          registry.refParameter('categoryIncludeChildrenParam'),
          {
            name: 'include_services',
            in: 'query',
            description: 'Include services in this category',
            schema: {
              type: 'boolean',
              default: false,
            },
          },
          registry.refParameter('acceptLanguageParam'),
        ],
        responses: {
          '200': {
            description: 'Category retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('Category'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '500': registry.refResponse('ServerError'),
        },
      },
      patch: {
        tags: ['Categories'],
        operationId: 'updateCategory',
        summary: 'Update category',
        description: 'Modify a category (admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('CategoryUpdate'),
              examples: {
                updateCategory: {
                  summary: 'Update category name',
                  value: {
                    name: {
                      es: 'Servicios Eléctricos',
                      en: 'Electrical Services',
                      gn: "Tataendy mba'e mba'apokuéra",
                    },
                    active: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Category updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('Category'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to update categories',
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
        tags: ['Categories'],
        operationId: 'deleteCategory',
        summary: 'Delete category',
        description: 'Remove a category (admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Category deleted successfully',
          },
          '400': {
            description: 'Category has child categories or services',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '403': {
            description: 'Not authorized to delete categories',
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
