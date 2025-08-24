import type {
  Business,
  FavouriteBusiness,
  FavouriteVoucher,
  Voucher,
} from '@prisma/client'

import { BusinessMapper } from './BusinessMapper.js'
import { VoucherMapper } from './VoucherMapper.js'

// Define local item interfaces for internal use
export interface FavoriteBusinessItem {
  id: string
  businessId: string
  createdAt: Date
  business?: any
}

export interface FavoriteVoucherItem {
  id: string
  voucherId: string
  createdAt: Date
  voucher?: any
}

export class FavoriteMapper {
  // =============== Business Favorites ===============

  /**
   * Convert database favorite business to API response item
   */
  static toFavoriteBusinessItem(
    favorite: FavouriteBusiness & {
      business?: Business & { category?: any; businessDetails?: any }
    },
  ): FavoriteBusinessItem {
    return {
      id: favorite.id,
      businessId: favorite.businessId,
      createdAt: favorite.createdAt,
      business: favorite.business
        ? BusinessMapper.toDTO(
            BusinessMapper.fromDocument(favorite.business as any),
          )
        : undefined,
    }
  }

  /**
   * Convert add favorite business result to API response
   */
  static toAddFavoriteBusinessResponse(
    favorite: FavouriteBusiness & {
      business?: Business & { category?: any; businessDetails?: any }
    },
  ) {
    return {
      message: 'Business added to favorites',
      data: this.toFavoriteBusinessItem(favorite),
    }
  }

  // =============== Voucher Favorites ===============

  /**
   * Convert database favorite voucher to API response item
   */
  static toFavoriteVoucherItem(
    favorite: FavouriteVoucher & {
      voucher?: Voucher & { business?: Business; category?: any }
    },
  ): FavoriteVoucherItem {
    return {
      id: favorite.id,
      voucherId: favorite.voucherId,
      createdAt: favorite.createdAt,
      voucher: favorite.voucher
        ? VoucherMapper.toDTO(
            VoucherMapper.fromDocument(favorite.voucher as any),
          )
        : undefined,
    }
  }

  /**
   * Convert add favorite voucher result to API response
   */
  static toAddFavoriteVoucherResponse(
    favorite: FavouriteVoucher & {
      voucher?: Voucher & { business?: Business; category?: any }
    },
  ) {
    return {
      message: 'Voucher added to favorites',
      data: this.toFavoriteVoucherItem(favorite),
    }
  }

  // =============== Common ===============

  /**
   * Convert favorite status check to API response
   */
  static toFavoriteStatusResponse(status: {
    isFavorited: boolean
    favoritedAt?: Date
  }) {
    return {
      isFavorited: status.isFavorited,
      favoritedAt: status.favoritedAt,
    }
  }

  /**
   * Convert batch operation result to API response
   */
  static toBatchFavoriteOperationResponse(result: {
    added?: number
    removed?: number
    errors: any[]
  }) {
    return {
      added: result.added || 0,
      removed: result.removed || 0,
      errors: result.errors,
    }
  }

  /**
   * Convert remove favorite response
   */
  static toRemoveFavoriteResponse() {
    return {
      message: 'Item removed from favorites',
    }
  }
}
