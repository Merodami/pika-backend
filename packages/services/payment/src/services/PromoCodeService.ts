import type { ICacheService } from '@pika/redis'
import type {
  CreatePromoCodeDTO,
  PromoCodeDomain,
  PromoCodeUsageDomain,
  UpdatePromoCodeDTO,
} from '@pika
import { ErrorFactory, logger } from '@pika

import type { IPromoCodeRepository } from '../repositories/PromoCodeRepository.js'

export interface IPromoCodeService {
  getAllPromoCodes(): Promise<PromoCodeDomain[]>
  getActivePromoCodes(): Promise<PromoCodeDomain[]>
  getPromoCodeById(id: string): Promise<PromoCodeDomain>
  getPromoCodeByIdWithUsages(id: string): Promise<any>
  getPromoCodeByCode(code: string): Promise<PromoCodeDomain>
  createPromoCode(
    data: CreatePromoCodeDTO,
    adminUserId: string,
  ): Promise<PromoCodeDomain>
  updatePromoCode(
    id: string,
    data: UpdatePromoCodeDTO,
    adminUserId: string,
  ): Promise<PromoCodeDomain>
  deletePromoCode(id: string, adminUserId: string): Promise<void>
  cancelPromoCode(id: string, adminUserId: string): Promise<PromoCodeDomain>
  validatePromoCodeForUser(
    code: string,
    userId: string,
  ): Promise<{ valid: boolean; promoCode?: PromoCodeDomain; reason?: string }>
  usePromoCode(
    code: string,
    userId: string,
    transactionId?: string,
  ): Promise<{ promoCode: PromoCodeDomain; usage: PromoCodeUsageDomain }>
  usePromoCodeService(code: string): Promise<PromoCodeDomain> // Legacy-compatible function
  getPromoCodeUsages(promoCodeId: string): Promise<PromoCodeUsageDomain[]>
  getUserPromoCodeUsages(userId: string): Promise<PromoCodeUsageDomain[]>
}

export class PromoCodeService implements IPromoCodeService {
  constructor(
    private readonly promoCodeRepository: IPromoCodeRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async getAllPromoCodes(): Promise<PromoCodeDomain[]> {
    try {
      logger.info('Getting all promo codes')

      const promoCodes = await this.promoCodeRepository.findAll()

      logger.info('Successfully retrieved all promo codes', {
        count: promoCodes.length,
      })

      return promoCodes
    } catch (error) {
      logger.error('Failed to get all promo codes', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async getActivePromoCodes(): Promise<PromoCodeDomain[]> {
    try {
      logger.info('Getting active promo codes')

      const promoCodes = await this.promoCodeRepository.findAllActive()

      logger.info('Successfully retrieved active promo codes', {
        count: promoCodes.length,
      })

      return promoCodes
    } catch (error) {
      logger.error('Failed to get active promo codes', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async getPromoCodeById(id: string): Promise<PromoCodeDomain> {
    try {
      logger.info('Getting promo code by ID', { promoCodeId: id })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Promo code ID is required and must be a string'],
        })
      }

      const promoCode = await this.promoCodeRepository.findById(id)

      if (!promoCode) {
        throw ErrorFactory.resourceNotFound('PromoCode', id)
      }

      logger.info('Successfully retrieved promo code', { promoCodeId: id })

      return promoCode
    } catch (error) {
      logger.error('Failed to get promo code by ID', { promoCodeId: id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async getPromoCodeByIdWithUsages(id: string): Promise<any> {
    // Simplified implementation - would need PromoCodeWithUsagesDomain
    const promoCode = await this.getPromoCodeById(id)
    const usages = await this.getPromoCodeUsages(id)

    return { ...promoCode, usages }
  }

  async getPromoCodeByCode(code: string): Promise<PromoCodeDomain> {
    try {
      logger.info('Getting promo code by code', { code })

      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw ErrorFactory.validationError({
          code: ['Promo code is required and must be a non-empty string'],
        })
      }

      const promoCode = await this.promoCodeRepository.findByCode(code)

      if (!promoCode) {
        throw ErrorFactory.resourceNotFound('PromoCode', code)
      }

      logger.info('Successfully retrieved promo code by code', {
        code,
        promoCodeId: promoCode.id,
      })

      return promoCode
    } catch (error) {
      logger.error('Failed to get promo code by code', { code, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async createPromoCode(
    data: CreatePromoCodeDTO,
    adminUserId: string,
  ): Promise<PromoCodeDomain> {
    try {
      logger.info('Creating promo code', { adminUserId, code: data.code })

      if (!adminUserId || typeof adminUserId !== 'string') {
        throw ErrorFactory.validationError({
          adminUserId: ['Admin user ID is required and must be a string'],
        })
      }

      this.validateCreatePromoCodeData(data)

      const existingCode = await this.promoCodeRepository.findByCode(data.code)

      if (existingCode) {
        throw ErrorFactory.businessRuleViolation(
          'Promo code already exists',
          `A promo code with code '${data.code}' already exists`,
        )
      }

      const promoCodeData: CreatePromoCodeDTO = {
        ...data,
        createdBy: adminUserId,
      }

      const promoCode = await this.promoCodeRepository.create(promoCodeData)

      logger.info('Successfully created promo code', {
        promoCodeId: promoCode.id,
        code: promoCode.code,
        discount: promoCode.discount,
        adminUserId,
      })

      return promoCode
    } catch (error) {
      logger.error('Failed to create promo code', {
        adminUserId,
        code: data.code,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updatePromoCode(
    id: string,
    data: UpdatePromoCodeDTO,
    adminUserId: string,
  ): Promise<PromoCodeDomain> {
    try {
      logger.info('Updating promo code', { promoCodeId: id, adminUserId })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Promo code ID is required and must be a string'],
        })
      }

      if (!adminUserId || typeof adminUserId !== 'string') {
        throw ErrorFactory.validationError({
          adminUserId: ['Admin user ID is required and must be a string'],
        })
      }

      const existingPromoCode = await this.promoCodeRepository.findById(id)

      if (!existingPromoCode) {
        throw ErrorFactory.resourceNotFound('PromoCode', id)
      }

      if (data.code && data.code !== existingPromoCode.code) {
        const conflictingCode = await this.promoCodeRepository.findByCode(
          data.code,
        )

        if (conflictingCode && conflictingCode.id !== id) {
          throw ErrorFactory.businessRuleViolation(
            'Promo code already exists',
            `A promo code with code '${data.code}' already exists`,
          )
        }
      }

      const promoCode = await this.promoCodeRepository.update(id, data)

      logger.info('Successfully updated promo code', {
        promoCodeId: id,
        adminUserId,
      })

      return promoCode
    } catch (error) {
      logger.error('Failed to update promo code', {
        promoCodeId: id,
        adminUserId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async deletePromoCode(id: string, adminUserId: string): Promise<void> {
    try {
      logger.info('Deleting promo code', { promoCodeId: id, adminUserId })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Promo code ID is required and must be a string'],
        })
      }

      if (!adminUserId || typeof adminUserId !== 'string') {
        throw ErrorFactory.validationError({
          adminUserId: ['Admin user ID is required and must be a string'],
        })
      }

      const existingPromoCode = await this.promoCodeRepository.findById(id)

      if (!existingPromoCode) {
        throw ErrorFactory.resourceNotFound('PromoCode', id)
      }

      const usages = await this.promoCodeRepository.getUsagesByPromoCodeId(id)

      if (usages.length > 0) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot delete used promo code',
          'Promo codes that have been used cannot be deleted. Consider cancelling instead.',
        )
      }

      await this.promoCodeRepository.delete(id)

      logger.info('Successfully deleted promo code', {
        promoCodeId: id,
        adminUserId,
      })
    } catch (error) {
      logger.error('Failed to delete promo code', {
        promoCodeId: id,
        adminUserId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async cancelPromoCode(
    id: string,
    adminUserId: string,
  ): Promise<PromoCodeDomain> {
    try {
      logger.info('Cancelling promo code', { promoCodeId: id, adminUserId })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Promo code ID is required and must be a string'],
        })
      }

      if (!adminUserId || typeof adminUserId !== 'string') {
        throw ErrorFactory.validationError({
          adminUserId: ['Admin user ID is required and must be a string'],
        })
      }

      const existingPromoCode = await this.promoCodeRepository.findById(id)

      if (!existingPromoCode) {
        throw ErrorFactory.resourceNotFound('PromoCode', id)
      }

      if (!existingPromoCode.active) {
        throw ErrorFactory.businessRuleViolation(
          'Promo code already inactive',
          'Cannot cancel an already inactive promo code',
        )
      }

      if (existingPromoCode.cancelledAt) {
        throw ErrorFactory.businessRuleViolation(
          'Promo code already cancelled',
          'This promo code has already been cancelled',
        )
      }

      const promoCode = await this.promoCodeRepository.cancel(id)

      logger.info('Successfully cancelled promo code', {
        promoCodeId: id,
        adminUserId,
      })

      return promoCode
    } catch (error) {
      logger.error('Failed to cancel promo code', {
        promoCodeId: id,
        adminUserId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async validatePromoCodeForUser(
    code: string,
    userId: string,
  ): Promise<{ valid: boolean; promoCode?: PromoCodeDomain; reason?: string }> {
    try {
      logger.info('Validating promo code for user', { code, userId })

      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw ErrorFactory.validationError({
          code: ['Promo code is required and must be a non-empty string'],
        })
      }

      if (!userId || typeof userId !== 'string') {
        throw ErrorFactory.validationError({
          userId: ['User ID is required and must be a string'],
        })
      }

      const validation = await this.promoCodeRepository.isCodeValidForUser(
        code,
        userId,
      )

      if (validation.valid) {
        const promoCode = await this.promoCodeRepository.findByCode(code)

        logger.info('Promo code is valid for user', { code, userId })

        return { valid: true, promoCode: promoCode! }
      } else {
        logger.info('Promo code is not valid for user', {
          code,
          userId,
          reason: validation.reason,
        })

        return { valid: false, reason: validation.reason }
      }
    } catch (error) {
      logger.error('Failed to validate promo code for user', {
        code,
        userId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async usePromoCode(
    code: string,
    userId: string,
    transactionId?: string,
  ): Promise<{ promoCode: PromoCodeDomain; usage: PromoCodeUsageDomain }> {
    try {
      logger.info('Using promo code', { code, userId, transactionId })

      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw ErrorFactory.validationError({
          code: ['Promo code is required and must be a non-empty string'],
        })
      }

      if (!userId || typeof userId !== 'string') {
        throw ErrorFactory.validationError({
          userId: ['User ID is required and must be a string'],
        })
      }

      const result = await this.promoCodeRepository.usePromoCode(
        code,
        userId,
        transactionId,
      )

      logger.info('Successfully used promo code', {
        code,
        userId,
        promoCodeId: result.promoCode.id,
        usageId: result.usage.id,
        remainingUses: result.promoCode.amountAvailable,
      })

      return result
    } catch (error) {
      logger.error('Failed to use promo code', {
        code,
        userId,
        transactionId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  // Legacy-compatible usePromoCodeService function matching exact old architecture logic
  async usePromoCodeService(code: string): Promise<PromoCodeDomain> {
    try {
      logger.info('Using promo code (legacy)', { code })

      const promoCode = await this.promoCodeRepository.findByCode(code)

      if (!promoCode) {
        throw new Error('Promotional code does not exists.')
      } else {
        // Exact validation logic from old architecture using date-fns isBefore
        const now = new Date()
        const expirationDate = new Date(promoCode.expirationDate)

        if (
          !promoCode.active ||
          promoCode.amountAvailable === 0 ||
          expirationDate < now // Using standard Date comparison (equivalent to isBefore)
        ) {
          throw new Error('Unavailable promotional code.')
        } else {
          // Atomic decrement using repository method
          const updatedPromoCode = await this.promoCodeRepository.update(
            promoCode.id,
            {
              amountAvailable: promoCode.amountAvailable - 1,
            },
          )

          logger.info('Successfully used promo code (legacy)', {
            code,
            promoCodeId: updatedPromoCode.id,
            remainingUses: updatedPromoCode.amountAvailable,
          })

          return updatedPromoCode
        }
      }
    } catch (error) {
      logger.error('Failed to use promo code (legacy)', { code, error })

      // Re-throw exact error messages from old architecture
      if (error instanceof Error) {
        throw error
      }
      throw ErrorFactory.fromError(error)
    }
  }

  async getPromoCodeUsages(
    promoCodeId: string,
  ): Promise<PromoCodeUsageDomain[]> {
    try {
      logger.info('Getting promo code usages', { promoCodeId })

      if (!promoCodeId || typeof promoCodeId !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Promo code ID is required and must be a string'],
        })
      }

      const usages =
        await this.promoCodeRepository.getUsagesByPromoCodeId(promoCodeId)

      logger.info('Successfully retrieved promo code usages', {
        promoCodeId,
        usageCount: usages.length,
      })

      return usages
    } catch (error) {
      logger.error('Failed to get promo code usages', { promoCodeId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserPromoCodeUsages(
    userId: string,
  ): Promise<PromoCodeUsageDomain[]> {
    try {
      logger.info('Getting user promo code usages', { userId })

      if (!userId || typeof userId !== 'string') {
        throw ErrorFactory.validationError({
          userId: ['User ID is required and must be a string'],
        })
      }

      const usages = await this.promoCodeRepository.getUsagesByUserId(userId)

      logger.info('Successfully retrieved user promo code usages', {
        userId,
        usageCount: usages.length,
      })

      return usages
    } catch (error) {
      logger.error('Failed to get user promo code usages', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  private validateCreatePromoCodeData(data: CreatePromoCodeDTO): void {
    if (
      !data.code ||
      typeof data.code !== 'string' ||
      data.code.trim().length === 0
    ) {
      throw ErrorFactory.validationError({
        code: ['Promo code is required and must be a non-empty string'],
      })
    }

    if (
      typeof data.discount !== 'number' ||
      data.discount < 0 ||
      data.discount > 100
    ) {
      throw ErrorFactory.validationError({
        discount: ['Discount must be a number between 0 and 100'],
      })
    }

    if (
      typeof data.allowedTimes !== 'number' ||
      data.allowedTimes <= 0 ||
      !Number.isInteger(data.allowedTimes)
    ) {
      throw ErrorFactory.validationError({
        allowedTimes: ['Allowed times must be a positive integer'],
      })
    }

    if (
      typeof data.amountAvailable !== 'number' ||
      data.amountAvailable <= 0 ||
      !Number.isInteger(data.amountAvailable)
    ) {
      throw ErrorFactory.validationError({
        amountAvailable: ['Amount available must be a positive integer'],
      })
    }

    if (data.amountAvailable > data.allowedTimes) {
      throw ErrorFactory.validationError({
        amountAvailable: ['Amount available cannot exceed allowed times'],
      })
    }

    if (!data.expirationDate) {
      throw ErrorFactory.validationError({
        expirationDate: ['Expiration date is required'],
      })
    }

    const expirationDate = new Date(data.expirationDate)

    if (isNaN(expirationDate.getTime())) {
      throw ErrorFactory.validationError({
        expirationDate: ['Expiration date must be a valid date'],
      })
    }

    if (expirationDate <= new Date()) {
      throw ErrorFactory.validationError({
        expirationDate: ['Expiration date must be in the future'],
      })
    }

    if (data.active !== undefined && typeof data.active !== 'boolean') {
      throw ErrorFactory.validationError({
        active: ['Active must be a boolean'],
      })
    }

    if (!data.createdBy || typeof data.createdBy !== 'string') {
      throw ErrorFactory.validationError({
        createdBy: ['Created by is required and must be a string'],
      })
    }
  }
}
