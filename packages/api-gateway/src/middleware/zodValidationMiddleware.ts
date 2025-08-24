import { logger } from '@pika/shared'
import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

/**
 * Production-ready Zod validation middleware for API Gateway
 * Based on express-zod-safe patterns but adapted for our architecture
 */

export interface ValidationSchema {
  body?: z.ZodTypeAny
  query?: z.ZodTypeAny
  params?: z.ZodTypeAny
  headers?: z.ZodTypeAny
}

export interface ValidationOptions {
  /**
   * Whether to strip unknown properties from the validated data
   * @default true
   */
  stripUnknown?: boolean

  /**
   * Custom error handler
   */
  errorHandler?: (error: z.ZodError<any>, req: Request, res: Response) => void

  /**
   * Whether to log validation errors
   * @default true
   */
  logErrors?: boolean
}

/**
 * Create a validation middleware for Express routes
 * This follows the express-zod-safe pattern but with our error format
 */
export function createValidationMiddleware(
  schema: ValidationSchema,
  options: ValidationOptions = {},
) {
  const { errorHandler, logErrors = true } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context: ValidationContext = {
        validatedData: {},
        errors: [],
      }

      // Validate all request parts
      const bodyResult = await validateRequestProperty(
        schema.body,
        req.body,
        'body',
        context,
      )

      if (bodyResult !== undefined) req.body = bodyResult

      const queryResult = await validateRequestProperty(
        schema.query,
        req.query,
        'query',
        context,
      )

      if (queryResult !== undefined) req.query = queryResult as any

      const paramsResult = await validateRequestProperty(
        schema.params,
        req.params,
        'params',
        context,
      )

      if (paramsResult !== undefined) req.params = paramsResult as any

      const headersResult = await validateRequestProperty(
        schema.headers,
        req.headers,
        'headers',
        context,
        (headers) => extractRelevantHeaders(headers, schema.headers!),
      )

      if (headersResult !== undefined) req.headers = headersResult as any

      // Handle validation errors
      if (context.errors.length > 0) {
        return processValidationErrors(
          context.errors,
          req,
          res,
          errorHandler,
          logErrors,
        )
      }

      // Attach validated data to request for downstream use
      ;(req as any).validated = context.validatedData
      next()
    } catch (error) {
      // Handle unexpected errors
      logger.error('Unexpected error in validation middleware', error as Error)
      res.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
        correlationId: getCorrelationId(req),
      })
    }
  }
}

/**
 * Validation middleware factory functions
 */
export const validate = {
  /**
   * Validate request body
   */
  body: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ body: schema }, options),

  /**
   * Validate query parameters
   */
  query: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ query: schema }, options),

  /**
   * Validate URL parameters
   */
  params: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ params: schema }, options),

  /**
   * Validate headers
   */
  headers: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ headers: schema }, options),

  /**
   * Validate multiple parts of the request
   */
  request: (schema: ValidationSchema, options?: ValidationOptions) =>
    createValidationMiddleware(schema, options),
}

/**
 * Validate a single request property
 */
interface ValidationContext {
  validatedData: Record<string, any>
  errors: z.ZodError<any>[]
}

async function validateRequestProperty(
  schema: z.ZodTypeAny | undefined,
  data: any,
  propertyName: string,
  context: ValidationContext,
  transform?: (data: any) => any,
): Promise<any> {
  if (!schema) return undefined

  try {
    const dataToValidate = transform ? transform(data) : data
    const parsed = await schema.parseAsync(dataToValidate)

    context.validatedData[propertyName] = parsed

    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      context.errors.push(error)
    }

    return undefined
  }
}

/**
 * Extract only the headers that are defined in the schema
 */
function extractRelevantHeaders(
  headers: any,
  headerSchema: z.ZodTypeAny,
): Record<string, any> {
  const relevantHeaders: Record<string, any> = {}

  if (headerSchema instanceof z.ZodObject) {
    const shape = headerSchema.shape

    for (const key of Object.keys(shape)) {
      const headerKey = key.toLowerCase()

      if (headers[headerKey] !== undefined) {
        relevantHeaders[key] = headers[headerKey]
      }
    }
  }

  return relevantHeaders
}

/**
 * Handle validation errors with custom or default error handler
 */
function processValidationErrors(
  errors: z.ZodError<any>[],
  req: Request,
  res: Response,
  errorHandler?: (error: z.ZodError<any>, req: Request, res: Response) => void,
  logErrors = true,
): void {
  const combinedError = combineZodErrors(errors)

  if (logErrors) {
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: combinedError.issues,
    })
  }

  if (errorHandler) {
    errorHandler(combinedError, req, res)
  } else {
    handleValidationError(combinedError, req, res)
  }
}

/**
 * Combine multiple ZodErrors into a single error
 */
function combineZodErrors(errors: z.ZodError<any>[]): z.ZodError<any> {
  const allIssues = errors.flatMap((error) => error.issues)

  return new z.ZodError(allIssues)
}

/**
 * Get correlation ID from request
 */
function getCorrelationId(req: Request): string {
  return (req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    'unknown') as string
}

/**
 * Default validation error handler
 */
function handleValidationError(
  error: z.ZodError<any>,
  req: Request,
  res: Response,
): void {
  // Use zod-validation-error for better error messages
  const validationError = fromZodError(error as any)

  // Format errors to match our API error format
  const formattedErrors = error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    ...(err.code === 'invalid_type' && { received: (err as any).received }),
  }))

  res.status(400).json({
    statusCode: 400,
    error: 'Bad Request',
    message: validationError.message,
    details: formattedErrors,
    correlationId: getCorrelationId(req),
    timestamp: new Date().toISOString(),
  })
}
