import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getPreferredLanguage, RequestContext } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { UserMapper } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  logger,
  NotAuthorizedError,
  processMultilingualContent,
} from '@pika/shared'
import { UserRole } from '@pika/types-core'
import type { FastifyRequest } from 'fastify'

import {
  adaptUserSearchQuery,
  ApiUserSearchQuery,
} from '../../../application/adapters/sortingAdapter.js'
import {
  GetAllUsersHandler,
  GetUserByEmailHandler,
  GetUserByIdHandler,
} from '../../../application/use_cases/queries/index.js'

/**
 * Controller handling HTTP requests for user read operations
 */
export class UserController {
  constructor(
    private readonly getAllUsersHandler: GetAllUsersHandler,
    private readonly getUserByIdHandler: GetUserByIdHandler,
    private readonly getUserByEmailHandler: GetUserByEmailHandler,
  ) {
    this.getAllUsers = this.getAllUsers.bind(this)
    this.getUserById = this.getUserById.bind(this)
    this.getUserByEmail = this.getUserByEmail.bind(this)
  }

  /**
   * GET /users
   * Get all users with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'users',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllUsers(
    request: FastifyRequest<{ Querystring: ApiUserSearchQuery }>,
  ) {
    try {
      const context = RequestContext.fromHeaders(request)

      // Authorization: Only admins can list all users
      if (context.role !== UserRole.ADMIN) {
        throw new NotAuthorizedError('Only administrators can list all users', {
          source: 'UserController.getAllUsers',
          metadata: { requesterId: context.userId },
        })
      }

      logger.debug(
        'Executing UserController.getAllUsers with params:',
        request.query,
      )

      const query = request.query
      const searchParams = adaptUserSearchQuery(query)
      const result = await this.getAllUsersHandler.execute(searchParams)

      // Convert domain entities to DTOs using mapper
      const dtoResult = {
        data: result.data.map((user) => UserMapper.toDTO(user)),
        pagination: result.pagination,
      }

      // Get the preferred language from the request.language property
      // This is set by the languageNegotiation plugin
      const preferredLanguage = getPreferredLanguage(request)

      // Use the reusable multilingual content processor
      return processMultilingualContent(
        dtoResult,
        {
          multilingualFields: [],
          recursiveFields: [],
        },
        preferredLanguage,
      )
    } catch (error) {
      logger.error('Error in UserController.getAllUsers:', error)

      // Handle validation errors
      if (error.code === 'INVALID_QUERY_PARAMETERS') {
        throw ErrorFactory.validationError(
          {
            query: [`Invalid query parameters: ${error.message}`],
          },
          {
            correlationId: request.id,
            source: 'UserController.getAllUsers',
            suggestion:
              'Check the API documentation for valid query parameters',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_users',
          'Failed to fetch users from database',
          error,
          {
            correlationId: request.id,
            source: 'UserController.getAllUsers',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle other errors
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /users/:userId
   * Get a specific user by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'users',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserById(
    request: FastifyRequest<{
      Params: { user_id: string }
      Querystring: {
        include_addresses?: boolean
        include_payment_methods?: boolean
        include_customer_profile?: boolean
        include_provider_profile?: boolean
      }
    }>,
  ) {
    try {
      const context = RequestContext.fromHeaders(request)
      const { user_id } = request.params

      // Authorization: Users can only view their own profile unless they're admin
      if (context.role !== UserRole.ADMIN && context.userId !== user_id) {
        throw new NotAuthorizedError('You can only view your own profile', {
          source: 'UserController.getUserById',
          metadata: { userId: user_id, requesterId: context.userId },
        })
      }

      logger.debug(
        `Executing UserController.getUserById with ID: ${request.params.user_id}`,
      )

      const {
        include_addresses,
        include_payment_methods,
        include_customer_profile,
        include_provider_profile,
      } = request.query

      // Build query options from parameters
      const user = await this.getUserByIdHandler.execute({
        id: user_id,
        includeAddresses: include_addresses,
        includePaymentMethods: include_payment_methods,
        includeCustomerProfile: include_customer_profile,
        includeProviderProfile: include_provider_profile,
      })

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', user_id, {
          correlationId: request.id,
          source: 'UserController.getUserById',
          suggestion:
            'Check that the user ID exists and is in the correct format',
          metadata: {
            requestParams: request.params,
            requestQuery: request.query,
          },
        })
      }

      // Convert domain entity to DTO using mapper
      const apiResponse = UserMapper.toDTO(user)

      // Get the preferred language from the request.language property
      const preferredLanguage = getPreferredLanguage(request)

      // Use our reusable multilingual processor for consistent handling
      return processMultilingualContent(
        apiResponse,
        {
          multilingualFields: [],
          recursiveFields: [],
        },
        preferredLanguage,
      )
    } catch (error) {
      logger.error(`Error retrieving user ${request.params.user_id}:`, error)

      // If it's already a BaseError from our system, just rethrow it
      if (
        error &&
        typeof error === 'object' &&
        'context' in error &&
        'domain' in error.context
      ) {
        throw error
      }

      // Handle specific error cases
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound('User', request.params.user_id, {
          correlationId: request.id,
          source: 'UserController.getUserById',
        })
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_user_by_id',
          'Failed to fetch user from database',
          error,
          {
            correlationId: request.id,
            source: 'UserController.getUserById',
            metadata: { userId: request.params.user_id },
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // For any other unexpected errors
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /users/email/:email
   * Get a specific user by email
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'users',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserByEmail(
    request: FastifyRequest<{
      Params: { email: string }
    }>,
  ) {
    try {
      const context = RequestContext.fromHeaders(request)

      // Authorization: Only admins can search users by email
      if (context.role !== UserRole.ADMIN) {
        throw new NotAuthorizedError(
          'Only administrators can search users by email',
          {
            source: 'UserController.getUserByEmail',
            metadata: { requesterId: context.userId },
          },
        )
      }

      logger.debug(
        `Executing UserController.getUserByEmail with email: ${request.params.email}`,
      )

      const { email } = request.params

      // Execute handler
      const user = await this.getUserByEmailHandler.execute({ email })

      if (!user) {
        throw ErrorFactory.resourceNotFound('User with email', email, {
          correlationId: request.id,
          source: 'UserController.getUserByEmail',
          suggestion:
            'Check that the email exists and is in the correct format',
          metadata: {
            requestParams: request.params,
          },
        })
      }

      // Convert domain entity to DTO using mapper
      const apiResponse = UserMapper.toDTO(user)

      // Get the preferred language from the request.language property
      const preferredLanguage = getPreferredLanguage(request)

      // Use our reusable multilingual processor for consistent handling
      return processMultilingualContent(
        apiResponse,
        {
          multilingualFields: [],
          recursiveFields: [],
        },
        preferredLanguage,
      )
    } catch (error) {
      logger.error(
        `Error retrieving user by email ${request.params.email}:`,
        error,
      )

      // If it's already a BaseError from our system, just rethrow it
      if (
        error &&
        typeof error === 'object' &&
        'context' in error &&
        'domain' in error.context
      ) {
        throw error
      }

      // Handle specific error cases
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound(
          'User with email',
          request.params.email,
          {
            correlationId: request.id,
            source: 'UserController.getUserByEmail',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_user_by_email',
          'Failed to fetch user from database',
          error,
          {
            correlationId: request.id,
            source: 'UserController.getUserByEmail',
            metadata: { email: request.params.email },
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // For any other unexpected errors
      throw ErrorFactory.fromError(error)
    }
  }
}
