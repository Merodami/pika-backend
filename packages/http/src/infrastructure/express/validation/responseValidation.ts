import { NODE_ENV, VALIDATE_RESPONSES } from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'
import { z } from 'zod'

/**
 * Validates response data against a Zod schema in non-production environments.
 * In production, returns data without validation for performance.
 * 
 * This function helps catch response schema mismatches during development
 * and testing while avoiding performance overhead in production.
 * 
 * @example
 * ```typescript
 * // Instead of:
 * const validatedResponse = schema.parse(response)
 * 
 * // Use:
 * const validatedResponse = validateResponse(
 *   schema,
 *   response,
 *   'UserController.getProfile'
 * )
 * ```
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param context - Optional context string for better error logging (e.g., 'ControllerName.methodName')
 * @returns The data cast to the schema type (validated in dev/test, passed through in prod)
 */
export function validateResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context?: string,
): z.infer<T> {
  // Skip validation in production unless explicitly enabled
  if (!VALIDATE_RESPONSES) {
    return data as z.infer<T>
  }

  const result = schema.safeParse(data)

  if (!result.success) {
    // Log error with context for debugging
    logger.error('Response validation failed', {
      context: context || 'Unknown',
      errors: result.error.format(),
      environment: NODE_ENV,
      // Only log actual data in development to avoid exposing sensitive info
      data: NODE_ENV === 'development' ? data : undefined,
    })

    // In non-production environments, throw validation error
    if (NODE_ENV !== 'production') {
      const validationErrors = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
      
      throw ErrorFactory.validationError(
        `Response validation failed${context ? ` in ${context}` : ''}`,
        validationErrors
      )
    }
  }

  // Always return the original data
  // In dev/test: logged if invalid
  // In prod: passed through without validation
  return data as z.infer<T>
}