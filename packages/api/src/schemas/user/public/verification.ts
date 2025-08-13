import { FIELD_LENGTH, VerificationType } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Unified verification request schema (raw Zod)
 */
export const UnifiedVerificationRequest = z.object({
  type: createZodEnum(VerificationType),
  token: z.string().optional(),
  code: z.string().length(FIELD_LENGTH.VERIFICATION_CODE_LENGTH).optional(),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

/**
 * Unified verification request schema (OpenAPI documented)
 */
export const UnifiedVerificationRequestSchema =
  UnifiedVerificationRequest.openapi('UnifiedVerificationRequest', {
    description: 'Unified verification request',
  })

export type UnifiedVerificationRequest = z.infer<
  typeof UnifiedVerificationRequest
>

/**
 * Unified resend verification request schema (raw Zod)
 */
export const UnifiedResendVerificationRequest = z.object({
  type: z.enum([VerificationType.EMAIL, VerificationType.PHONE]),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

/**
 * Unified resend verification request schema (OpenAPI documented)
 */
export const UnifiedResendVerificationRequestSchema =
  UnifiedResendVerificationRequest.openapi('UnifiedResendVerificationRequest', {
    description: 'Unified resend verification request',
  })

export type UnifiedResendVerificationRequest = z.infer<
  typeof UnifiedResendVerificationRequest
>

/**
 * Unified verification response schema (raw Zod)
 */
export const UnifiedVerificationResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

/**
 * Unified verification response schema (OpenAPI documented)
 */
export const UnifiedVerificationResponseSchema =
  UnifiedVerificationResponse.openapi('UnifiedVerificationResponse', {
    description: 'Unified verification response',
  })

export type UnifiedVerificationResponse = z.infer<
  typeof UnifiedVerificationResponse
>
