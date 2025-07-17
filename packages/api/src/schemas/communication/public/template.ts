import { z } from 'zod'

import {
  activeStatus,
  withTimestamps,
} from '../../../common/schemas/metadata.js'
import { UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { SearchParams } from '../../shared/pagination.js'
import { openapi } from '../../../common/utils/openapi.js'
import {
  TemplateType,
  TemplateCategory,
  TemplateVariableType,
  TemplateSortBy,
  EmailPriority,
} from '../common/enums.js'

/**
 * Communication template schemas for public API
 */

// ============= Template Schema =============

/**
 * Communication template
 */
export const Template = openapi(
  withTimestamps({
    id: UUID,
    name: z.string().min(1).max(100).describe('Template name'),
    slug: z.string().min(1).max(100).describe('URL-friendly identifier'),
    type: TemplateType,
    category: TemplateCategory,
    description: z.string().max(500).optional(),

    // Template content
    subject: z
      .string()
      .max(255)
      .optional()
      .describe('Email/notification subject'),
    content: z.string().describe('Template content with variables'),
    htmlContent: z.string().optional().describe('HTML version for emails'),

    // Variables and metadata
    variables: z
      .array(
        z.object({
          name: z.string().describe('Variable name (e.g., userName)'),
          type: TemplateVariableType,
          required: z.boolean().default(true),
          defaultValue: z.any().optional(),
          description: z.string().optional(),
        }),
      )
      .default([]),

    // Configuration
    locale: z.string().length(5).default('en-US').describe('Template locale'),
    priority: EmailPriority.default('normal'),

    // Metadata
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.any()).optional(),

    // Usage stats
    usageCount: z.number().int().nonnegative().default(0),
    lastUsedAt: z.string().datetime().optional(),
  }).merge(activeStatus),
  {
    description: 'Communication template',
  },
)

export type Template = z.infer<typeof Template>

// ============= Create Template =============

/**
 * Create template request
 */
export const CreateTemplateRequest = openapi(
  z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).optional(),
    type: TemplateType,
    category: TemplateCategory,
    description: z.string().max(500).optional(),
    subject: z.string().max(255).optional(),
    content: z.string(),
    htmlContent: z.string().optional(),
    variables: z
      .array(
        z.object({
          name: z.string(),
          type: TemplateVariableType,
          required: z.boolean().default(true),
          defaultValue: z.any().optional(),
          description: z.string().optional(),
        }),
      )
      .optional(),
    locale: z.string().length(5).default('en-US'),
    priority: EmailPriority.default('normal'),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Create a new communication template',
  },
)

export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequest>

// ============= Update Template =============

/**
 * Update template request
 */
export const UpdateTemplateRequest = openapi(
  z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    subject: z.string().max(255).optional(),
    content: z.string().optional(),
    htmlContent: z.string().optional(),
    variables: z
      .array(
        z.object({
          name: z.string(),
          type: TemplateVariableType,
          required: z.boolean().default(true),
          defaultValue: z.any().optional(),
          description: z.string().optional(),
        }),
      )
      .optional(),
    priority: EmailPriority.optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    isActive: z.boolean().optional(),
  }),
  {
    description: 'Update an existing template',
  },
)

export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateRequest>

// ============= Clone Template =============

/**
 * Clone template request
 */
export const CloneTemplateRequest = openapi(
  z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).optional(),
    locale: z.string().length(5).optional(),
  }),
  {
    description: 'Clone an existing template',
  },
)

export type CloneTemplateRequest = z.infer<typeof CloneTemplateRequest>

// ============= Test Template =============

/**
 * Test template request
 */
export const TestTemplateRequest = openapi(
  z.object({
    templateId: UUID.describe('Template ID to validate'),
    variables: z.record(z.any()).describe('Test variables for the template'),
    recipient: z.string().optional().describe('Test recipient (email/phone)'),
  }),
  {
    description: 'Test a template with sample data',
  },
)

export type TestTemplateRequest = z.infer<typeof TestTemplateRequest>

/**
 * Test template response
 */
export const TestTemplateResponse = openapi(
  z.object({
    subject: z.string().optional(),
    content: z.string(),
    htmlContent: z.string().optional(),
    preview: z
      .object({
        text: z.string().optional(),
        html: z.string().optional(),
      })
      .optional(),
  }),
  {
    description: 'Template test result',
  },
)

export type TestTemplateResponse = z.infer<typeof TestTemplateResponse>

// ============= Search Templates =============

/**
 * Template search parameters
 */
export const TemplateSearchParams = SearchParams.extend({
  type: TemplateType.optional(),
  category: TemplateCategory.optional(),
  locale: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortBy: TemplateSortBy.default('name'),
})

export type TemplateSearchParams = z.infer<typeof TemplateSearchParams>

/**
 * Template list response
 */
export const TemplateListResponse = paginatedResponse(Template)

export type TemplateListResponse = z.infer<typeof TemplateListResponse>

// ============= Template Versions =============

/**
 * Template version
 */
export const TemplateVersion = z.object({
  id: UUID,
  templateId: UUID,
  version: z.number().int().positive(),
  content: z.string(),
  htmlContent: z.string().optional(),
  subject: z.string().optional(),
  variables: z.array(
    z.object({
      name: z.string(),
      type: TemplateVariableType,
      required: z.boolean(),
      defaultValue: z.any().optional(),
      description: z.string().optional(),
    }),
  ),
  createdAt: z.string().datetime(),
  createdBy: UUID.optional(),
  notes: z.string().optional(),
})

export type TemplateVersion = z.infer<typeof TemplateVersion>

/**
 * Template version history response
 */
export const TemplateVersionHistoryResponse = z.object({
  templateId: UUID,
  currentVersion: z.number().int().positive(),
  versions: z.array(TemplateVersion),
})

export type TemplateVersionHistoryResponse = z.infer<
  typeof TemplateVersionHistoryResponse
>

// ============= Bulk Operations =============

/**
 * Bulk template update
 */
export const BulkTemplateUpdateRequest = openapi(
  z.object({
    templateIds: z.array(UUID).min(1).max(100),
    updates: z.object({
      category: TemplateCategory.optional(),
      priority: EmailPriority.optional(),
      tags: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
  {
    description: 'Update multiple templates at once',
  },
)

export type BulkTemplateUpdateRequest = z.infer<
  typeof BulkTemplateUpdateRequest
>

/**
 * Bulk template operation response
 */
export const BulkTemplateOperationResponse = z.object({
  updated: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        templateId: UUID,
        error: z.string(),
      }),
    )
    .optional(),
})

export type BulkTemplateOperationResponse = z.infer<
  typeof BulkTemplateOperationResponse
>
