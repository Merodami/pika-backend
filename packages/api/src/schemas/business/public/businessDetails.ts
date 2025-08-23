import { z } from 'zod'
import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'
import { withTimestamps } from '../../shared/metadata.js'
import { FIELD_LENGTH } from '@pika/types'

/**
 * Business details schemas for contact and location information
 */

// ============= Business Details Response =============

/**
 * Business details response (raw Zod)
 */
export const BusinessDetailsResponse = withTimestamps({
  id: UUID,
  businessId: UUID.describe('Business ID this details belong to'),
  
  // Contact Information
  phone: z.string().max(20).optional().describe('Business phone number'),
  email: z.string().email().max(255).optional().describe('Business email address'),
  website: z.string().url().max(255).optional().describe('Business website URL'),
  
  // Address Information
  street: z.string().max(255).optional().describe('Street address'),
  city: z.string().max(100).optional().describe('City'),
  state: z.string().max(100).optional().describe('State or province'),
  postalCode: z.string().max(20).optional().describe('Postal/ZIP code'),
  country: z.string().length(2).optional().describe('Country code (ISO 3166-1 alpha-2)'),
  
  // Operating Information
  operatingHours: z.record(z.string(), z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
  })).optional().describe('Operating hours schedule (JSON)'),
  socialMedia: z.record(z.string(), z.string().url()).optional().describe('Social media links (JSON)'),
  additionalInfo: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe('Additional business information (JSON)'),
})

/**
 * Business details response (OpenAPI documented)
 */
export const BusinessDetailsResponseSchema = BusinessDetailsResponse.openapi(
  'BusinessDetailsResponse',
  {
    description: 'Detailed contact and location information for a business',
  },
)

export type BusinessDetailsResponse = z.infer<typeof BusinessDetailsResponse>

// ============= Update Business Details Request =============

/**
 * Update business details request (raw Zod)
 */
export const UpdateBusinessDetailsRequest = z.object({
  // Contact Information
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  website: z.string().url().max(255).optional(),
  
  // Address Information
  street: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  
  // Operating Information
  operatingHours: z.record(z.string(), z.object({
    open: z.string().optional(),
    close: z.string().optional(),
    closed: z.boolean().optional(),
  })).optional(),
  socialMedia: z.record(z.string(), z.string().url()).optional(),
  additionalInfo: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
}).refine((data) => Object.values(data).some((val) => val !== undefined), {
  message: 'At least one field must be provided',
})

/**
 * Update business details request (OpenAPI documented)
 */
export const UpdateBusinessDetailsRequestSchema = openapi(
  UpdateBusinessDetailsRequest,
  {
    description: 'Update business contact and location details',
  },
)

export type UpdateBusinessDetailsRequest = z.infer<typeof UpdateBusinessDetailsRequest>