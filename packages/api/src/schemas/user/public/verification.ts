import { z } from 'zod'

import { VerificationType } from '../common/enums.js'

/**
 * Unified verification request schema
 */
export const UnifiedVerificationRequest = z.object({
  type: VerificationType,
  token: z.string().optional(),
  code: z.string().length(6).optional(),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

export type UnifiedVerificationRequest = z.infer<
  typeof UnifiedVerificationRequest
>

/**
 * Unified resend verification request schema
 */
export const UnifiedResendVerificationRequest = z.object({
  type: VerificationType,
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

export type UnifiedResendVerificationRequest = z.infer<
  typeof UnifiedResendVerificationRequest
>

/**
 * Unified verification response schema
 */
export const UnifiedVerificationResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export type UnifiedVerificationResponse = z.infer<
  typeof UnifiedVerificationResponse
>
