import { NODE_ENV } from '@pika/environment'
import { BaseError, createErrorHandler, ErrorFactory } from '@pika/shared'
import {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import fp from 'fastify-plugin'
import { get, set } from 'lodash-es'

// STEP 1: Import the translator function from our new validation utility
import { translateValidationErrors } from '../validation/validation.js'

/**
 * Options for the error middleware
 */
export interface ErrorMiddlewareOptions {
  enableStackTrace?: boolean
}

/**
 * Shared error handling middleware for Fastify applications.
 * This plugin sets up a global error handler that consistently formats errors across services.
 */
export const fastifyErrorMiddleware = fp(function (
  fastify: FastifyInstance,
  options: ErrorMiddlewareOptions,
  done,
) {
  const _enableStackTrace =
    typeof options.enableStackTrace !== 'undefined'
      ? options.enableStackTrace
      : NODE_ENV !== 'production'

  const errorHandler = createErrorHandler(NODE_ENV === 'production')

  // STEP 2: Mark the setErrorHandler function as `async` to allow for `await`
  fastify.setErrorHandler(
    async (
      error: FastifyError,
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      if (reply.sent) {
        return
      }

      if (error instanceof BaseError) {
        return errorHandler(error, request, reply)
      }

      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        'message' in error
      ) {
        const statusCode = (error as any).status || 500

        return reply.status(statusCode).send({
          status: statusCode,
          message: error.message,
          content: (error as any).content || {},
        })
      }

      if ((error as FastifyError).validation) {
        const validationErrors = (error as FastifyError).validation || []

        if (validationErrors.length > 0) {
          await translateValidationErrors(validationErrors, request)
        }

        // The rest of your existing logic continues below, but now it operates
        // on the translated error messages. No other changes are needed here.
        const errorsByField: Record<string, string[]> = {}

        validationErrors.forEach((validation: any) => {
          if (!validation) return // Skip undefined/null validation objects

          let field = 'request'

          if (
            validation.keyword === 'required' &&
            validation.params?.missingProperty
          ) {
            field = validation.params.missingProperty
          } else if (validation.instancePath) {
            field = validation.instancePath.slice(1) || field
          } else if (validation.dataPath) {
            field = validation.dataPath.slice(1) || field
          }

          const message = validation.message || 'Invalid value'
          const existingErrors = get(errorsByField, field, [])

          set(errorsByField, field, [...existingErrors, message])
        })

        const validationError = ErrorFactory.validationError(errorsByField, {
          correlationId: request.id?.toString(),
          source: `${request.method} ${request.url}`,
        })

        return errorHandler(validationError, request, reply)
      }

      const convertedError = ErrorFactory.fromError(error)

      return errorHandler(convertedError, request, reply)
    },
  )

  done()
})
