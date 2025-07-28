/**
 * Frontend Authentication Validation
 *
 * Architecture:
 * - Zod schemas from @pika/api for validation (single source of truth)
 * - Generated SDK types for API calls
 * - Following backend import patterns
 */

// Import from @pika/api using the same pattern as backend services
import { authFrontend, authPublic, shared } from '@pika/api'

// Import SDK types for API responses
import type {
  AuthTokensResponse as AuthTokensResponseType,
  AuthUserResponse as AuthUserResponseType,
} from '@/lib/api/generated'

// ============= Direct exports from frontend schemas =============

// All form schemas and transforms
export const {
  // Form schemas
  LoginFormSchema,
  RegisterFormSchema,
  ForgotPasswordFormSchema,
  ResetPasswordFormSchema,

  // Multi-step registration
  RegistrationStep1Schema,
  RegistrationStep2Schema,
  RegistrationStep3Schema,

  // Transform functions
  transformLoginToTokenRequest,
  transformRegisterToAPI,
  transformResetPasswordToAPI,
  combineRegistrationSteps,
} = authFrontend

// ============= Type exports =============

// Form data types from frontend schemas
export type LoginFormData = authFrontend.LoginFormData
export type RegisterFormData = authFrontend.RegisterFormData
export type ForgotPasswordFormData = authFrontend.ForgotPasswordFormData
export type ResetPasswordFormData = authFrontend.ResetPasswordFormData
export type RegistrationStep1Data = authFrontend.RegistrationStep1Data
export type RegistrationStep2Data = authFrontend.RegistrationStep2Data
export type RegistrationStep3Data = authFrontend.RegistrationStep3Data

// ============= Backend schemas for API calls =============

// Re-export backend schemas
export const {
  RegisterRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
} = authPublic

export const { TokenRequest, AuthTokensResponse, AuthUserResponse } = authPublic

export const {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} = authPublic

// ============= Shared utilities =============

// Branded types and primitives
export const { Email, UserId, JWTToken, URL, Money, Percentage } = shared

export const { PhoneNumber, DateTime, UUID } = shared

// ============= SDK type aliases =============

// Use SDK types for API responses
export type { AuthTokensResponseType, AuthUserResponseType }
