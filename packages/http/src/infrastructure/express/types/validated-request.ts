import type { Request } from 'express'

/**
 * Helper functions for handling validated request data after Zod middleware transformation
 *
 * These helpers provide type-safe access to validated query, params, and body data
 * after Zod middleware has transformed the values at runtime.
 *
 * This solves the Express + Zod + TypeScript integration issue where:
 * - Express provides query as ParsedQs (strings)
 * - Zod transforms to proper types (numbers, dates, etc.)
 * - TypeScript doesn't track runtime transformations
 *
 * Industry standard approach used by Total TypeScript, tRPC, and production codebases.
 */

/**
 * Get validated query parameters with proper typing
 *
 * @example
 * ```typescript
 * // Instead of:
 * const { page, limit } = request.query // TS Error: string vs number
 *
 * // Use:
 * const query = getValidatedQuery<SessionHistoryQuery>(request)
 * const { page, limit } = query // page and limit are numbers
 * ```
 */
export function getValidatedQuery<T>(request: Request): T {
  // The validation middleware has already transformed request.query
  // This helper just provides the correct typing
  return request.query as T
}

/**
 * Get validated params with proper typing
 *
 * @example
 * ```typescript
 * const params = getValidatedParams<SessionIdParam>(request)
 * const { id } = params // id is properly typed
 * ```
 */
export function getValidatedParams<T>(request: Request): T {
  return request.params as T
}

/**
 * Get validated body with proper typing
 *
 * @example
 * ```typescript
 * const body = getValidatedBody<CreateSessionRequest>(request)
 * // body is fully typed according to schema
 * ```
 */
export function getValidatedBody<T>(request: Request): T {
  return request.body as T
}

/**
 * Alternative: Destructure validated data in one call
 *
 * @example
 * ```typescript
 * const { query, params, body } = getValidatedData<
 *   SessionHistoryQuery,
 *   SessionIdParam,
 *   UpdateSessionRequest
 * >(request)
 * ```
 */
export function getValidatedData<TQuery = any, TParams = any, TBody = any>(
  request: Request,
): {
  query: TQuery
  params: TParams
  body: TBody
} {
  return {
    query: request.query as TQuery,
    params: request.params as TParams,
    body: request.body as TBody,
  }
}
