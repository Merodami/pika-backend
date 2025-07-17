import { createRetryLogger } from '@sdk/libs/logger.js'
import { RetryConfig } from '@sdk/libs/RetryApiClient.js'

/**
 * A type representing potential API errors.
 *
 * Extends the standard Error object to include an optional `body` property which may contain
 * additional information such as a message and error data. The `data` object can further provide
 * details like an error code, status code, and message.
 *
 * @typedef {Error & { body?: {
 *   message: string,
 *   data?: {
 *     code?: string,
 *     status_code?: string,
 *     message?: string
 *   }
 * }}} MaybeAPIError
 */
export type MaybeAPIError = Error & {
  body?: {
    message: string
    data?: {
      code?: string
      status_code?: string
      message?: string
    }
  }
}

/**
 * Default retry configuration for all API clients
 * This is exported for documentation purposes
 */
// This config is used by the frontend client
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  timeout: 10000,
  baseDelay: 500,
  maxDelay: 5000,
  useExponentialBackoff: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
  logger: createRetryLogger(),
}

/**
 * Extracts a human-readable error message from an unknown error object.
 *
 * This function takes an error of unknown type and attempts to cast it as a `MaybeAPIError`.
 * It then returns the error message contained in the error's `body.message` if available,
 * otherwise it returns the standard error message from `error.message`.
 *
 * @param {*} error - The error object to parse.
 * @returns {string|null} The extracted error message or null if no error is provided.
 */
export function getErrorMessage(error: unknown) {
  if (!error) {
    return null
  }

  const castError = error as MaybeAPIError

  return castError.body?.message ?? castError.message
}

/**
 * Re-export the `ApiError` class from the openapi module.
 *
 * This allows consumers of this module to access the ApiError class directly.
 */
export { ApiError } from './openapi/index.js'
