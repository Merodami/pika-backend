import type {
  TemplateSearchParams as ApiTemplateSearchParams,
  CreateTemplateRequest,
  TemplateIdParam,
  TestTemplateRequest,
  UpdateTemplateRequest,
} from '@pika/api/public'
import type { CreateTemplateDTO, UpdateTemplateDTO } from '@pika/sdk'
import { TemplateMapper } from '@pika/sdk'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery } from '@pika/http'
import type { NextFunction, Request, Response } from 'express'

import type { TemplateSearchParams } from '../repositories/TemplateRepository.js'
import type { ITemplateService } from '../services/TemplateService.js'

export interface ITemplateController {
  createTemplate(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getTemplates(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  getTemplateById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  updateTemplate(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  deleteTemplate(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  validateTemplate(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>

  seedTemplates(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
}

/**
 * Handles email and notification template management
 */
export class TemplateController implements ITemplateController {
  constructor(private readonly templateService: ITemplateService) {
    // Bind all methods to preserve 'this' context
    this.createTemplate = this.createTemplate.bind(this)
    this.getTemplates = this.getTemplates.bind(this)
    this.getTemplateById = this.getTemplateById.bind(this)
    this.updateTemplate = this.updateTemplate.bind(this)
    this.deleteTemplate = this.deleteTemplate.bind(this)
    this.validateTemplate = this.validateTemplate.bind(this)
    this.seedTemplates = this.seedTemplates.bind(this)
  }

  /**
   * POST /templates
   * Create a new template
   */
  async createTemplate(
    request: Request<{}, {}, CreateTemplateRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      logger.info('Creating template', { name: data.name, type: data.type })

      // Transform API request to service DTO
      const templateDto: CreateTemplateDTO = {
        name: data.name,
        type: data.type,
        category: data.category,
        externalId: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        subject: data.subject,
        body: data.content,
        description: data.description,
        variables: data.variables,
        metadata: data.metadata,
        isActive: true, // Default for new templates
      }

      const template = await this.templateService.createTemplate(templateDto)

      response.json(TemplateMapper.toDTO(template))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /templates
   * Get all templates with filters
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'templates-list',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getTemplates(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<ApiTemplateSearchParams>(request)

      // Transform API params to service params
      const params: TemplateSearchParams = {
        page: query.page,
        limit: query.limit,
        type: query.type,
        category: query.category,
        isActive: query.isActive,
        search: query.search,
      }

      logger.info('Getting templates', { params })

      const result = await this.templateService.getAllTemplates(params)

      response.json({
        data: result.data.map(TemplateMapper.toDTO),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /templates/:id
   * Get template by ID
   */
  async getTemplateById(
    request: Request<TemplateIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Getting template by ID', { id })

      const template = await this.templateService.getTemplateById(id)

      response.json(TemplateMapper.toDTO(template))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /templates/:id
   * Update template
   */
  async updateTemplate(
    request: Request<TemplateIdParam, {}, UpdateTemplateRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body

      logger.info('Updating template', { id })

      // Transform API request to service DTO
      const templateDto: UpdateTemplateDTO = {
        name: data.name,
        subject: data.subject,
        body: data.content,
        description: data.description,
        metadata: data.metadata,
        isActive: data.isActive,
        // Note: category, externalId, and variables are not in UpdateTemplateDTO
      }

      const template = await this.templateService.updateTemplate(
        id,
        templateDto,
      )

      response.json(TemplateMapper.toDTO(template))
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /templates/:id
   * Delete template
   */
  async deleteTemplate(
    request: Request<TemplateIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Deleting template', { id })

      await this.templateService.deleteTemplate(id)

      response.json({ message: 'Template deleted successfully' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /templates/validate
   * Validate template with variables
   */
  async validateTemplate(
    request: Request<{}, {}, TestTemplateRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { templateId, variables } = request.body

      logger.info('Validating template', { templateId })

      const template = await this.templateService.getTemplateById(templateId)
      const isValid = await this.templateService.validateTemplate(
        template,
        variables,
      )

      if (!isValid) {
        throw ErrorFactory.businessRuleViolation(
          'Template validation failed',
          'The provided variables do not match the template requirements',
        )
      }

      // Try to compile and return preview
      const compiledContent = await this.templateService.compileTemplate(
        template,
        variables,
      )

      response.json({
        valid: true,
        preview: compiledContent,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /templates/seed
   * Seed default templates
   */
  async seedTemplates(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      logger.info('Seeding default templates')

      await this.templateService.seedDefaultTemplates()

      response.json({ message: 'Default templates seeded successfully' })
    } catch (error) {
      next(error)
    }
  }
}
