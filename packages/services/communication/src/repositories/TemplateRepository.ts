import type { ICacheService } from '@pika/redis'
import type { TemplateDomain } from '@pika/sdk'
import { TemplateMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

export interface CreateTemplateInput {
  name: string
  type: string
  category?: string
  externalId: string
  subject?: string
  body: string
  description?: string
  variables?: any
  metadata?: any
  isActive?: boolean
}

export interface UpdateTemplateInput {
  name?: string
  category?: string
  externalId?: string
  subject?: string
  body?: string
  description?: string
  variables?: any
  metadata?: any
  isActive?: boolean
}

export interface TemplateSearchParams {
  page?: number
  limit?: number
  type?: string
  category?: string
  isActive?: boolean
  search?: string
}

export interface ITemplateRepository {
  create(data: CreateTemplateInput): Promise<TemplateDomain>
  findById(id: string): Promise<TemplateDomain | null>
  findByExternalId(externalId: string): Promise<TemplateDomain | null>
  findAll(
    params: TemplateSearchParams,
  ): Promise<PaginatedResult<TemplateDomain>>
  update(id: string, data: UpdateTemplateInput): Promise<TemplateDomain>
  delete(id: string): Promise<void>
}

export class TemplateRepository implements ITemplateRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async create(data: CreateTemplateInput): Promise<TemplateDomain> {
    logger.info('Creating template', { name: data.name, type: data.type })

    try {
      const template = await this.prisma.template.create({
        data: {
          name: data.name,
          type: data.type,
          category: data.category,
          externalId: data.externalId,
          subject: data.subject,
          body: data.body,
          description: data.description,
          variables: data.variables,
          metadata: data.metadata,
          isActive: data.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return TemplateMapper.fromDocument(template)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'Template with this name or external ID already exists',
            'Name and external ID must be unique',
          )
        }
      }
      throw ErrorFactory.databaseError('create', 'Template', error)
    }
  }

  async findById(id: string): Promise<TemplateDomain | null> {
    try {
      const template = await this.prisma.template.findUnique({
        where: { id },
      })

      return template ? TemplateMapper.fromDocument(template) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'Template', error)
    }
  }

  async findByExternalId(externalId: string): Promise<TemplateDomain | null> {
    try {
      const template = await this.prisma.template.findFirst({
        where: { externalId: externalId },
      })

      return template ? TemplateMapper.fromDocument(template) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findByExternalId', 'Template', error)
    }
  }

  async findAll(
    params: TemplateSearchParams,
  ): Promise<PaginatedResult<TemplateDomain>> {
    const { page = 1, limit = 20, type, category, isActive, search } = params

    const skip = (page - 1) * limit

    const where: Prisma.TemplateWhereInput = {
      ...(type && { type }),
      ...(category && { category }),
      ...(isActive !== undefined && { isActive: isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    try {
      const [templates, total] = await Promise.all([
        this.prisma.template.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.template.count({ where }),
      ])

      const data = templates.map(TemplateMapper.fromDocument)

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError('findAll', 'Template', error)
    }
  }

  async update(id: string, data: UpdateTemplateInput): Promise<TemplateDomain> {
    try {
      const template = await this.prisma.template.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          externalId: data.externalId,
          subject: data.subject,
          body: data.body,
          description: data.description,
          variables: data.variables,
          metadata: data.metadata,
          isActive: data.isActive,
          updatedAt: new Date(),
        },
      })

      return TemplateMapper.fromDocument(template)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Template', id)
        }
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'Template with this name or external ID already exists',
            'Name and external ID must be unique',
          )
        }
      }
      throw ErrorFactory.databaseError('update', 'Template', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.template.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Template', id)
        }
        if (error.code === 'P2003') {
          throw ErrorFactory.businessRuleViolation(
            'Cannot delete template',
            'Template is being used by communication logs',
          )
        }
      }
      throw ErrorFactory.databaseError('delete', 'Template', error)
    }
  }
}
