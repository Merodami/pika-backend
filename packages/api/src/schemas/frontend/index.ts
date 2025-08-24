/**
 * Frontend Form Schemas
 *
 * Centralized location for all UI form schemas
 * These extend backend schemas with frontend-specific validations
 */

// Authentication forms
export * as authForms from './auth/index.js'

// Business forms
export * as businessForms from './business/index.js'

// Re-export commonly used branded types for frontend
export {
  Email,
  JWTToken,
  Money,
  Percentage,
  URL,
  UserId,
} from '../shared/branded.js'
export { DateOnly, DateTime, PhoneNumber, UUID } from '../shared/primitives.js'
