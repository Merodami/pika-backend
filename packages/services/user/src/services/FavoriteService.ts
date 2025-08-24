import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, type ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type { FavouriteBusiness, FavouriteVoucher } from '@prisma/client'

import type { IUserFavoriteRepository } from '../repositories/UserFavoriteRepository.js'

export interface IFavoriteService {
  // Business favorites
  addFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<FavouriteBusiness>
  removeFavoriteBusiness(userId: string, businessId: string): Promise<void>
  getFavoriteBusinesses(
    userId: string,
    params: FavoriteBusinessSearchParams,
  ): Promise<PaginatedResult<FavouriteBusiness>>
  checkFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }>
  batchFavoriteBusinesses(
    userId: string,
    operation: BatchFavoriteOperation,
  ): Promise<BatchFavoriteResult>

  // Voucher favorites
  addFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<FavouriteVoucher>
  removeFavoriteVoucher(userId: string, voucherId: string): Promise<void>
  getFavoriteVouchers(
    userId: string,
    params: FavoriteVoucherSearchParams,
  ): Promise<PaginatedResult<FavouriteVoucher>>
  checkFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }>
  batchFavoriteVouchers(
    userId: string,
    operation: BatchFavoriteOperation,
  ): Promise<BatchFavoriteResult>
}

export interface FavoriteBusinessSearchParams {
  page: number
  limit: number
  sortBy?: 'createdAt' | 'businessName'
  sortOrder?: 'asc' | 'desc'
  includeDetails?: boolean
}

export interface FavoriteVoucherSearchParams {
  page: number
  limit: number
  sortBy?: 'createdAt' | 'voucherTitle' | 'expiryDate'
  sortOrder?: 'asc' | 'desc'
  includeDetails?: boolean
}

export interface BatchFavoriteOperation {
  add?: string[]
  remove?: string[]
}

export interface BatchFavoriteResult {
  added: number
  removed: number
  errors: Array<{
    itemId: string
    operation: 'add' | 'remove'
    error: string
  }>
}

/**
 * Favorite service implementation with business logic
 * Handles favorite operations for businesses and vouchers
 * Designed to be easily extractable into its own microservice
 */
export class FavoriteService implements IFavoriteService {
  constructor(
    private readonly favoriteRepository: IUserFavoriteRepository,
    private readonly cache: ICacheService,
  ) {}

  // =============== Business Favorites ===============

  async addFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<FavouriteBusiness> {
    try {
      logger.info('Adding business to favorites', { userId, businessId })

      const favorite = await this.favoriteRepository.addFavoriteBusiness(
        userId,
        businessId,
      )

      // Invalidate related caches
      await this.invalidateFavoriteCache(userId, 'business')

      logger.info('Business added to favorites successfully', {
        userId,
        businessId,
        favoriteId: favorite.id,
      })

      return favorite
    } catch (error) {
      logger.error('Failed to add business to favorites', {
        error,
        userId,
        businessId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async removeFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<void> {
    try {
      logger.info('Removing business from favorites', { userId, businessId })

      await this.favoriteRepository.removeFavoriteBusiness(userId, businessId)

      // Invalidate related caches
      await this.invalidateFavoriteCache(userId, 'business')

      logger.info('Business removed from favorites successfully', {
        userId,
        businessId,
      })
    } catch (error) {
      logger.error('Failed to remove business from favorites', {
        error,
        userId,
        businessId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'favorites:businesses',
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [userId, params] = args

      return `${prefix}:${userId}:${JSON.stringify(params)}`
    },
  })
  async getFavoriteBusinesses(
    userId: string,
    params: FavoriteBusinessSearchParams,
  ): Promise<PaginatedResult<FavouriteBusiness>> {
    try {
      logger.debug('Getting favorite businesses', { userId, params })

      // Convert includeDetails to parsedIncludes for repository
      const repositoryParams = {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        parsedIncludes: params.includeDetails ? { business: true } : undefined,
      }

      const result = await this.favoriteRepository.getFavoriteBusinesses(
        userId,
        repositoryParams,
      )

      logger.info('Retrieved favorite businesses', {
        userId,
        count: result.data.length,
        total: result.pagination.total,
      })

      return result
    } catch (error) {
      logger.error('Failed to get favorite businesses', {
        error,
        userId,
        params,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'favorites:business:status',
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [userId, businessId] = args

      return `${prefix}:${userId}:${businessId}`
    },
  })
  async checkFavoriteBusiness(
    userId: string,
    businessId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }> {
    try {
      logger.debug('Checking favorite business status', { userId, businessId })

      const status = await this.favoriteRepository.isFavoriteBusiness(
        userId,
        businessId,
      )

      logger.debug('Favorite business status checked', {
        userId,
        businessId,
        ...status,
      })

      return status
    } catch (error) {
      logger.error('Failed to check favorite business status', {
        error,
        userId,
        businessId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async batchFavoriteBusinesses(
    userId: string,
    operation: BatchFavoriteOperation,
  ): Promise<BatchFavoriteResult> {
    try {
      logger.info('Performing batch favorite businesses operation', {
        userId,
        toAdd: operation.add?.length || 0,
        toRemove: operation.remove?.length || 0,
      })

      const result: BatchFavoriteResult = {
        added: 0,
        removed: 0,
        errors: [],
      }

      // Handle additions
      if (operation.add && operation.add.length > 0) {
        const addResult =
          await this.favoriteRepository.batchAddFavoriteBusinesses(
            userId,
            operation.add,
          )

        result.added = addResult.added
        result.errors.push(...addResult.errors)
      }

      // Handle removals
      if (operation.remove && operation.remove.length > 0) {
        const removeResult =
          await this.favoriteRepository.batchRemoveFavoriteBusinesses(
            userId,
            operation.remove,
          )

        result.removed = removeResult.removed
        result.errors.push(...removeResult.errors)
      }

      // Invalidate caches
      await this.invalidateFavoriteCache(userId, 'business')

      logger.info('Batch favorite businesses operation completed', {
        userId,
        added: result.added,
        removed: result.removed,
        errors: result.errors.length,
      })

      return result
    } catch (error) {
      logger.error('Failed to perform batch favorite businesses operation', {
        error,
        userId,
        operation,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  // =============== Voucher Favorites ===============

  async addFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<FavouriteVoucher> {
    try {
      logger.info('Adding voucher to favorites', { userId, voucherId })

      const favorite = await this.favoriteRepository.addFavoriteVoucher(
        userId,
        voucherId,
      )

      // Invalidate related caches
      await this.invalidateFavoriteCache(userId, 'voucher')

      logger.info('Voucher added to favorites successfully', {
        userId,
        voucherId,
        favoriteId: favorite.id,
      })

      return favorite
    } catch (error) {
      logger.error('Failed to add voucher to favorites', {
        error,
        userId,
        voucherId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async removeFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<void> {
    try {
      logger.info('Removing voucher from favorites', { userId, voucherId })

      await this.favoriteRepository.removeFavoriteVoucher(userId, voucherId)

      // Invalidate related caches
      await this.invalidateFavoriteCache(userId, 'voucher')

      logger.info('Voucher removed from favorites successfully', {
        userId,
        voucherId,
      })
    } catch (error) {
      logger.error('Failed to remove voucher from favorites', {
        error,
        userId,
        voucherId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'favorites:vouchers',
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [userId, params] = args

      return `${prefix}:${userId}:${JSON.stringify(params)}`
    },
  })
  async getFavoriteVouchers(
    userId: string,
    params: FavoriteVoucherSearchParams,
  ): Promise<PaginatedResult<FavouriteVoucher>> {
    try {
      logger.debug('Getting favorite vouchers', { userId, params })

      // Convert includeDetails to parsedIncludes for repository
      const repositoryParams = {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        parsedIncludes: params.includeDetails ? { voucher: true } : undefined,
      }

      const result = await this.favoriteRepository.getFavoriteVouchers(
        userId,
        repositoryParams,
      )

      logger.info('Retrieved favorite vouchers', {
        userId,
        count: result.data.length,
        total: result.pagination.total,
      })

      return result
    } catch (error) {
      logger.error('Failed to get favorite vouchers', { error, userId, params })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'favorites:voucher:status',
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [userId, voucherId] = args

      return `${prefix}:${userId}:${voucherId}`
    },
  })
  async checkFavoriteVoucher(
    userId: string,
    voucherId: string,
  ): Promise<{ isFavorited: boolean; favoritedAt?: Date }> {
    try {
      logger.debug('Checking favorite voucher status', { userId, voucherId })

      const status = await this.favoriteRepository.isFavoriteVoucher(
        userId,
        voucherId,
      )

      logger.debug('Favorite voucher status checked', {
        userId,
        voucherId,
        ...status,
      })

      return status
    } catch (error) {
      logger.error('Failed to check favorite voucher status', {
        error,
        userId,
        voucherId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async batchFavoriteVouchers(
    userId: string,
    operation: BatchFavoriteOperation,
  ): Promise<BatchFavoriteResult> {
    try {
      logger.info('Performing batch favorite vouchers operation', {
        userId,
        toAdd: operation.add?.length || 0,
        toRemove: operation.remove?.length || 0,
      })

      const result: BatchFavoriteResult = {
        added: 0,
        removed: 0,
        errors: [],
      }

      // Handle additions
      if (operation.add && operation.add.length > 0) {
        const addResult =
          await this.favoriteRepository.batchAddFavoriteVouchers(
            userId,
            operation.add,
          )

        result.added = addResult.added
        result.errors.push(...addResult.errors)
      }

      // Handle removals
      if (operation.remove && operation.remove.length > 0) {
        const removeResult =
          await this.favoriteRepository.batchRemoveFavoriteVouchers(
            userId,
            operation.remove,
          )

        result.removed = removeResult.removed
        result.errors.push(...removeResult.errors)
      }

      // Invalidate caches
      await this.invalidateFavoriteCache(userId, 'voucher')

      logger.info('Batch favorite vouchers operation completed', {
        userId,
        added: result.added,
        removed: result.removed,
        errors: result.errors.length,
      })

      return result
    } catch (error) {
      logger.error('Failed to perform batch favorite vouchers operation', {
        error,
        userId,
        operation,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  // =============== Cache Management ===============

  private async invalidateFavoriteCache(
    userId: string,
    type: 'business' | 'voucher',
  ): Promise<void> {
    try {
      // Invalidate list caches
      await this.cache.delPattern?.(`favorites:${type}es:${userId}:*`)
      // Invalidate status caches
      await this.cache.delPattern?.(`favorites:${type}:status:${userId}:*`)

      logger.debug('Favorite cache invalidated', { userId, type })
    } catch (error) {
      logger.warn('Failed to invalidate favorite cache', {
        error,
        userId,
        type,
      })
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }
}
