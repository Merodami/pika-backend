import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type {
  PrismaClient,
  VoucherDraft as PrismaVoucherDraft,
} from '@prisma/client'
import { Prisma } from '@prisma/client'

import type { VoucherDraft, VoucherDraftSearchParams } from '../types/index.js'

export interface IVoucherDraftRepository {
  create(data: CreateDraftData): Promise<VoucherDraft>
  findById(id: string): Promise<VoucherDraft | null>
  findByDraftId(draftId: string): Promise<VoucherDraft | null>
  findBySessionToken(sessionToken: string): Promise<VoucherDraft | null>
  findByUserId(
    userId: string,
    params?: VoucherDraftSearchParams,
  ): Promise<VoucherDraft[]>
  findAll(
    params?: VoucherDraftSearchParams,
  ): Promise<PaginatedResult<VoucherDraft>>
  update(id: string, data: UpdateDraftData): Promise<VoucherDraft>
  delete(id: string): Promise<void>
  deleteExpired(): Promise<number>
  markAsComplete(draftId: string, voucherId: string): Promise<VoucherDraft>
}

export interface CreateDraftData {
  draftId: string
  businessId: string
  userId: string
  sessionToken: string
  expiresAt: Date
  qrCode?: string
  titleKey?: string
  descriptionKey?: string
  termsAndConditionsKey?: string
}

export interface UpdateDraftData {
  currentStep?: number
  completedSteps?: number[]
  isComplete?: boolean
  step1Data?: Record<string, any>
  step2Data?: Record<string, any>
  step3Data?: Record<string, any>
  step4Data?: Record<string, any>
  step5Data?: Record<string, any>
  titleKey?: string
  descriptionKey?: string
  termsAndConditionsKey?: string
  qrCode?: string
  validationErrors?: Record<string, any>
  lastValidatedAt?: Date
  metadata?: Record<string, any>
  expiresAt?: Date
}

/**
 * Repository for managing voucher creation wizard drafts
 * Used by business owners to create vouchers step-by-step
 */
export class VoucherDraftRepository implements IVoucherDraftRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Maps Prisma VoucherDraft to domain VoucherDraft
   */
  private mapToDomain(draft: PrismaVoucherDraft): VoucherDraft {
    return {
      id: draft.id,
      draftId: draft.draftId,
      businessId: draft.businessId,
      userId: draft.userId,
      currentStep: draft.currentStep,
      completedSteps: draft.completedSteps,
      isComplete: draft.isComplete,
      step1Data: draft.step1Data as Record<string, any> | null,
      step2Data: draft.step2Data as Record<string, any> | null,
      step3Data: draft.step3Data as Record<string, any> | null,
      step4Data: draft.step4Data as Record<string, any> | null,
      step5Data: draft.step5Data as Record<string, any> | null,
      titleKey: draft.titleKey,
      descriptionKey: draft.descriptionKey,
      termsAndConditionsKey: draft.termsAndConditionsKey,
      qrCode: draft.qrCode,
      validationErrors: draft.validationErrors as Record<string, any> | null,
      lastValidatedAt: draft.lastValidatedAt,
      sessionToken: draft.sessionToken,
      expiresAt: draft.expiresAt,
      completedAt: draft.completedAt,
      voucherId: draft.voucherId,
      metadata: draft.metadata as Record<string, any> | null,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    }
  }

  async create(data: CreateDraftData): Promise<VoucherDraft> {
    try {
      const draft = await this.prisma.voucherDraft.create({
        data: {
          draftId: data.draftId,
          businessId: data.businessId,
          userId: data.userId,
          sessionToken: data.sessionToken,
          expiresAt: data.expiresAt,
          qrCode: data.qrCode,
          titleKey: data.titleKey,
          descriptionKey: data.descriptionKey,
          termsAndConditionsKey: data.termsAndConditionsKey,
        },
      })

      return this.mapToDomain(draft)
    } catch (error) {
      logger.error('Failed to create voucher draft', { error, data })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.[0]

          if (field === 'draftId') {
            throw ErrorFactory.businessRuleViolation(
              'Draft ID already exists',
              'Please try again',
            )
          }
          if (field === 'qrCode') {
            throw ErrorFactory.businessRuleViolation(
              'QR code already reserved',
              'Please try again',
            )
          }
        }
        throw ErrorFactory.databaseError(
          'create',
          'Failed to create draft',
          error,
        )
      }

      throw error
    }
  }

  async findById(id: string): Promise<VoucherDraft | null> {
    try {
      const draft = await this.prisma.voucherDraft.findUnique({
        where: { id },
      })

      return draft ? this.mapToDomain(draft) : null
    } catch (error) {
      logger.error('Failed to find voucher draft by ID', { error, id })
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to find draft',
        error,
      )
    }
  }

  async findByDraftId(draftId: string): Promise<VoucherDraft | null> {
    try {
      const draft = await this.prisma.voucherDraft.findUnique({
        where: { draftId },
      })

      return draft ? this.mapToDomain(draft) : null
    } catch (error) {
      logger.error('Failed to find voucher draft by draft ID', {
        error,
        draftId,
      })
      throw ErrorFactory.databaseError(
        'findByDraftId',
        'Failed to find draft',
        error,
      )
    }
  }

  async findBySessionToken(sessionToken: string): Promise<VoucherDraft | null> {
    try {
      const draft = await this.prisma.voucherDraft.findUnique({
        where: { sessionToken },
      })

      return draft ? this.mapToDomain(draft) : null
    } catch (error) {
      logger.error('Failed to find voucher draft by session token', {
        error,
        sessionToken,
      })
      throw ErrorFactory.databaseError(
        'findBySessionToken',
        'Failed to find draft',
        error,
      )
    }
  }

  async findByUserId(
    userId: string,
    params?: VoucherDraftSearchParams,
  ): Promise<VoucherDraft[]> {
    try {
      const where: Prisma.VoucherDraftWhereInput = { userId }

      // Filter by business if provided
      if (params?.businessId) {
        where.businessId = params.businessId
      }

      // Filter by completion status
      if (params?.isComplete !== undefined) {
        where.isComplete = params.isComplete
      }

      // Filter out expired drafts by default
      if (!params?.includeExpired) {
        where.expiresAt = { gt: new Date() }
      }

      // Filter out completed drafts by default
      if (!params?.includeCompleted) {
        where.completedAt = null
      }

      const drafts = await this.prisma.voucherDraft.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: params?.limit || 20,
      })

      return drafts.map(this.mapToDomain)
    } catch (error) {
      logger.error('Failed to find voucher drafts by user ID', {
        error,
        userId,
      })
      throw ErrorFactory.databaseError(
        'findByUserId',
        'Failed to find drafts',
        error,
      )
    }
  }

  /**
   * Find all drafts with pagination (for admin access)
   * Follows the standard pagination pattern from BusinessRepository
   */
  async findAll(
    params?: VoucherDraftSearchParams,
  ): Promise<PaginatedResult<VoucherDraft>> {
    try {
      const { page = 1, limit = PAGINATION_DEFAULT_LIMIT } = params || {}
      const skip = (page - 1) * limit

      // Build WHERE clause
      const where: Prisma.VoucherDraftWhereInput = {}

      // Filter by business if provided
      if (params?.businessId) {
        where.businessId = params.businessId
      }

      // Filter by completion status
      if (params?.isComplete !== undefined) {
        where.isComplete = params.isComplete
      }

      // Filter out expired drafts by default
      if (!params?.includeExpired) {
        where.expiresAt = { gt: new Date() }
      }

      // Filter out completed drafts by default
      if (!params?.includeCompleted) {
        where.completedAt = null
      }

      // Execute count and find queries in parallel
      const [totalCount, drafts] = await Promise.all([
        this.prisma.voucherDraft.count({ where }),
        this.prisma.voucherDraft.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      // Map to domain entities
      const domainDrafts = drafts.map(this.mapToDomain)

      const totalPages = Math.ceil(totalCount / limit)

      return {
        data: domainDrafts,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find all voucher drafts', {
        error,
        params,
      })
      throw ErrorFactory.databaseError(
        'findAll',
        'Failed to find drafts',
        error,
      )
    }
  }

  async update(id: string, data: UpdateDraftData): Promise<VoucherDraft> {
    try {
      const draft = await this.prisma.voucherDraft.update({
        where: { id },
        data: {
          currentStep: data.currentStep,
          completedSteps: data.completedSteps,
          isComplete: data.isComplete,
          step1Data: data.step1Data,
          step2Data: data.step2Data,
          step3Data: data.step3Data,
          step4Data: data.step4Data,
          step5Data: data.step5Data,
          titleKey: data.titleKey,
          descriptionKey: data.descriptionKey,
          termsAndConditionsKey: data.termsAndConditionsKey,
          qrCode: data.qrCode,
          validationErrors: data.validationErrors,
          lastValidatedAt: data.lastValidatedAt,
          metadata: data.metadata,
          expiresAt: data.expiresAt,
          updatedAt: new Date(),
        },
      })

      return this.mapToDomain(draft)
    } catch (error) {
      logger.error('Failed to update voucher draft', { error, id, data })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Draft', id)
        }
      }

      throw ErrorFactory.databaseError(
        'update',
        'Failed to update draft',
        error,
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.voucherDraft.delete({
        where: { id },
      })
    } catch (error) {
      logger.error('Failed to delete voucher draft', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Draft', id)
        }
      }

      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete draft',
        error,
      )
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.voucherDraft.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          completedAt: null,
        },
      })

      logger.info('Deleted expired voucher drafts', { count: result.count })

      return result.count
    } catch (error) {
      logger.error('Failed to delete expired voucher drafts', { error })
      throw ErrorFactory.databaseError(
        'deleteExpired',
        'Failed to delete expired drafts',
        error,
      )
    }
  }

  async markAsComplete(
    draftId: string,
    voucherId: string,
  ): Promise<VoucherDraft> {
    try {
      const draft = await this.prisma.voucherDraft.update({
        where: { draftId },
        data: {
          isComplete: true,
          completedAt: new Date(),
          voucherId,
          updatedAt: new Date(),
        },
      })

      return this.mapToDomain(draft)
    } catch (error) {
      logger.error('Failed to mark draft as complete', {
        error,
        draftId,
        voucherId,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Draft', draftId)
        }
      }

      throw ErrorFactory.databaseError(
        'markAsComplete',
        'Failed to mark draft as complete',
        error,
      )
    }
  }
}
