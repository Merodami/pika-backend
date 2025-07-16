import type { ICacheService } from '@pika/redis'
import type {
  CreateCreditsPackDTO,
  CreditsPackDomain,
  UpdateCreditsPackDTO,
} from '@pika
import { ErrorFactory, logger } from '@pika

import type { ICreditPackRepository } from '../repositories/CreditPackRepository.js'

export interface ICreditPackService {
  getAllCreditPacks(): Promise<CreditsPackDomain[]>
  getActiveCreditPacks(): Promise<CreditsPackDomain[]>
  getCreditPackById(id: string): Promise<CreditsPackDomain>
  createCreditPack(
    data: CreateCreditsPackDTO,
    adminUserId: string,
  ): Promise<CreditsPackDomain>
  updateCreditPack(
    id: string,
    data: UpdateCreditsPackDTO,
    adminUserId: string,
  ): Promise<CreditsPackDomain>
  deleteCreditPack(id: string, adminUserId: string): Promise<void>
  deactivateCreditPack(
    id: string,
    adminUserId: string,
  ): Promise<CreditsPackDomain>
  activateCreditPack(
    id: string,
    adminUserId: string,
  ): Promise<CreditsPackDomain>
}

export class CreditPackService implements ICreditPackService {
  constructor(
    private readonly creditPackRepository: ICreditPackRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async getAllCreditPacks(): Promise<CreditsPackDomain[]> {
    try {
      logger.info('Getting all credit packs')

      const packs = await this.creditPackRepository.findAll()

      logger.info('Successfully retrieved all credit packs', {
        count: packs.length,
      })

      return packs
    } catch (error) {
      logger.error('Failed to get all credit packs', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async getActiveCreditPacks(): Promise<CreditsPackDomain[]> {
    try {
      logger.info('Getting active credit packs')

      const packs = await this.creditPackRepository.findAllActive()

      logger.info('Successfully retrieved active credit packs', {
        count: packs.length,
      })

      return packs
    } catch (error) {
      logger.error('Failed to get active credit packs', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async getCreditPackById(id: string): Promise<CreditsPackDomain> {
    try {
      logger.info('Getting credit pack by ID', { creditPackId: id })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Credit pack ID is required and must be a string'],
        })
      }

      const pack = await this.creditPackRepository.findById(id)

      if (!pack) {
        throw ErrorFactory.resourceNotFound('CreditPack', id)
      }

      logger.info('Successfully retrieved credit pack', { creditPackId: id })

      return pack
    } catch (error) {
      logger.error('Failed to get credit pack by ID', {
        creditPackId: id,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async createCreditPack(
    data: CreateCreditsPackDTO,
    adminUserId: string,
  ): Promise<CreditsPackDomain> {
    try {
      logger.info('Creating credit pack', { adminUserId })

      this.validateAdminUserId(adminUserId)
      this.validateCreateCreditPackData(data)

      const packData: CreateCreditsPackDTO = {
        ...data,
        createdBy: adminUserId,
      }

      const pack = await this.creditPackRepository.create(packData)

      logger.info('Successfully created credit pack', {
        creditPackId: pack.id,
        type: pack.type,
        amount: pack.amount,
        price: pack.price,
        adminUserId,
      })

      return pack
    } catch (error) {
      logger.error('Failed to create credit pack', { adminUserId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateCreditPack(
    id: string,
    data: UpdateCreditsPackDTO,
    adminUserId: string,
  ): Promise<CreditsPackDomain> {
    try {
      logger.info('Updating credit pack', { creditPackId: id, adminUserId })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Credit pack ID is required and must be a string'],
        })
      }

      this.validateAdminUserId(adminUserId)
      this.validateUpdateCreditPackData(data)

      const existingPack = await this.creditPackRepository.findById(id)

      if (!existingPack) {
        throw ErrorFactory.resourceNotFound('CreditPack', id)
      }

      const pack = await this.creditPackRepository.update(id, data)

      logger.info('Successfully updated credit pack', {
        creditPackId: id,
        adminUserId,
      })

      return pack
    } catch (error) {
      logger.error('Failed to update credit pack', {
        creditPackId: id,
        adminUserId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteCreditPack(id: string, adminUserId: string): Promise<void> {
    try {
      logger.info('Deleting credit pack', { creditPackId: id, adminUserId })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Credit pack ID is required and must be a string'],
        })
      }

      this.validateAdminUserId(adminUserId)

      const existingPack = await this.creditPackRepository.findById(id)

      if (!existingPack) {
        throw ErrorFactory.resourceNotFound('CreditPack', id)
      }

      await this.creditPackRepository.delete(id)

      logger.info('Successfully deleted credit pack', {
        creditPackId: id,
        adminUserId,
      })
    } catch (error) {
      logger.error('Failed to delete credit pack', {
        creditPackId: id,
        adminUserId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async deactivateCreditPack(
    id: string,
    adminUserId: string,
  ): Promise<CreditsPackDomain> {
    try {
      logger.info('Deactivating credit pack', { creditPackId: id, adminUserId })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Credit pack ID is required and must be a string'],
        })
      }

      this.validateAdminUserId(adminUserId)

      const existingPack = await this.creditPackRepository.findById(id)

      if (!existingPack) {
        throw ErrorFactory.resourceNotFound('CreditPack', id)
      }

      if (!existingPack.active) {
        throw ErrorFactory.businessRuleViolation(
          'Credit pack already inactive',
          'Cannot deactivate an already inactive credit pack',
        )
      }

      const pack = await this.creditPackRepository.deactivate(id)

      logger.info('Successfully deactivated credit pack', {
        creditPackId: id,
        adminUserId,
      })

      return pack
    } catch (error) {
      logger.error('Failed to deactivate credit pack', {
        creditPackId: id,
        adminUserId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async activateCreditPack(
    id: string,
    adminUserId: string,
  ): Promise<CreditsPackDomain> {
    try {
      logger.info('Activating credit pack', { creditPackId: id, adminUserId })

      if (!id || typeof id !== 'string') {
        throw ErrorFactory.validationError({
          id: ['Credit pack ID is required and must be a string'],
        })
      }

      this.validateAdminUserId(adminUserId)

      const existingPack = await this.creditPackRepository.findById(id)

      if (!existingPack) {
        throw ErrorFactory.resourceNotFound('CreditPack', id)
      }

      if (existingPack.active) {
        throw ErrorFactory.businessRuleViolation(
          'Credit pack already active',
          'Cannot activate an already active credit pack',
        )
      }

      const pack = await this.creditPackRepository.activate(id)

      logger.info('Successfully activated credit pack', {
        creditPackId: id,
        adminUserId,
      })

      return pack
    } catch (error) {
      logger.error('Failed to activate credit pack', {
        creditPackId: id,
        adminUserId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  private validateAdminUserId(adminUserId: string): void {
    if (!adminUserId || typeof adminUserId !== 'string') {
      throw ErrorFactory.validationError({
        adminUserId: ['Admin user ID is required and must be a string'],
      })
    }
  }

  private validateCreateCreditPackData(data: CreateCreditsPackDTO): void {
    if (
      !data.type ||
      typeof data.type !== 'string' ||
      data.type.trim().length === 0
    ) {
      throw ErrorFactory.validationError({
        type: ['Type is required and must be a non-empty string'],
      })
    }

    if (
      typeof data.amount !== 'number' ||
      data.amount <= 0 ||
      !Number.isInteger(data.amount)
    ) {
      throw ErrorFactory.validationError({
        amount: ['Amount must be a positive integer'],
      })
    }

    if (
      typeof data.frequency !== 'number' ||
      data.frequency <= 0 ||
      !Number.isInteger(data.frequency)
    ) {
      throw ErrorFactory.validationError({
        frequency: ['Frequency must be a positive integer'],
      })
    }

    if (typeof data.price !== 'number' || data.price <= 0) {
      throw ErrorFactory.validationError({
        price: ['Price must be a positive number'],
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

  private validateUpdateCreditPackData(data: UpdateCreditsPackDTO): void {
    const hasUpdates =
      data.type !== undefined ||
      data.amount !== undefined ||
      data.frequency !== undefined ||
      data.price !== undefined ||
      data.active !== undefined

    if (!hasUpdates) {
      throw ErrorFactory.validationError({
        update: ['At least one field must be provided for update'],
      })
    }

    if (data.type !== undefined) {
      if (typeof data.type !== 'string' || data.type.trim().length === 0) {
        throw ErrorFactory.validationError({
          type: ['Type must be a non-empty string'],
        })
      }
    }

    if (data.amount !== undefined) {
      if (
        typeof data.amount !== 'number' ||
        data.amount <= 0 ||
        !Number.isInteger(data.amount)
      ) {
        throw ErrorFactory.validationError({
          amount: ['Amount must be a positive integer'],
        })
      }
    }

    if (data.frequency !== undefined) {
      if (
        typeof data.frequency !== 'number' ||
        data.frequency <= 0 ||
        !Number.isInteger(data.frequency)
      ) {
        throw ErrorFactory.validationError({
          frequency: ['Frequency must be a positive integer'],
        })
      }
    }

    if (data.price !== undefined) {
      if (typeof data.price !== 'number' || data.price <= 0) {
        throw ErrorFactory.validationError({
          price: ['Price must be a positive number'],
        })
      }
    }

    if (data.active !== undefined && typeof data.active !== 'boolean') {
      throw ErrorFactory.validationError({
        active: ['Active must be a boolean'],
      })
    }
  }
}
