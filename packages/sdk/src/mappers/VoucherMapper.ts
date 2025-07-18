import { VoucherState, VoucherDiscountType } from '@pika/types'

import type {
  VoucherDomain,
  CreateVoucherData,
  UpdateVoucherData,
  VoucherScanData,
  CustomerVoucherDomain,
  VoucherLocation,
  VoucherCode,
} from '../domain/voucher.js'
import type {
  VoucherDTO,
  CreateVoucherDTO,
  UpdateVoucherDTO,
  VoucherScanDTO,
  CustomerVoucherDTO,
  VoucherLocationDTO,
  VoucherCodeDTO,
} from '../dto/voucher.dto.js'

/**
 * Interface representing a database Voucher document
 * Uses camelCase for fields as they come from Prisma
 */
export interface VoucherDocument {
  id: string
  businessId: string
  categoryId: string
  state: string
  title: string // Base title (usually in default language)
  description: string // Base description (usually in default language)
  terms: string // Base terms (usually in default language)
  discountType: string
  discountValue: number
  currency: string
  location?: any | null // VoucherLocation stored as JSON
  imageUrl: string | null
  validFrom: Date | null
  expiresAt: Date | null
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata?: any | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
  codes?: Array<{
    id: string
    code: string
    type: string
    isActive: boolean
    metadata?: any
  }>
}

/**
 * Interface for customer voucher document
 */
export interface CustomerVoucherDocument {
  id: string
  userId: string
  voucherId: string
  status: string
  claimedAt: Date | null
  redeemedAt?: Date | null
  expiresAt: Date | null
  redemptionCode?: string | null
  redemptionLocation?: any | null
  metadata?: any | null
  createdAt: Date | null
  updatedAt: Date | null
  voucher?: VoucherDocument
}

/**
 * Comprehensive Voucher mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 */
export class VoucherMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: VoucherDocument): VoucherDomain {
    return {
      id: doc.id,
      businessId: doc.businessId,
      categoryId: doc.categoryId,
      state: mapVoucherState(doc.state),
      title: doc.title || '',
      description: doc.description || '',
      terms: doc.terms || '',
      discountType: mapVoucherDiscountType(doc.discountType),
      discountValue: doc.discountValue,
      currency: doc.currency,
      location: doc.location
        ? this.mapLocationFromDocument(doc.location)
        : null,
      imageUrl: doc.imageUrl,
      validFrom:
        doc.validFrom instanceof Date
          ? doc.validFrom
          : doc.validFrom
            ? new Date(doc.validFrom)
            : new Date(),
      expiresAt:
        doc.expiresAt instanceof Date
          ? doc.expiresAt
          : doc.expiresAt
            ? new Date(doc.expiresAt)
            : new Date(),
      maxRedemptions: doc.maxRedemptions,
      maxRedemptionsPerUser: doc.maxRedemptionsPerUser,
      currentRedemptions: doc.currentRedemptions,
      metadata: doc.metadata,
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt
          : doc.createdAt
            ? new Date(doc.createdAt)
            : new Date(),
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt
          : doc.updatedAt
            ? new Date(doc.updatedAt)
            : new Date(),
      deletedAt: doc.deletedAt
        ? doc.deletedAt instanceof Date
          ? doc.deletedAt
          : new Date(doc.deletedAt)
        : undefined,
      codes: doc.codes?.map((code) => this.mapCodeFromDocument(code)),
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase and handles date formatting
   */
  static toDTO(domain: VoucherDomain): VoucherDTO {
    const formatDate = (date: Date | string | undefined | null): string => {
      if (!date) return new Date().toISOString()
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()
      return new Date().toISOString()
    }

    return {
      id: domain.id,
      businessId: domain.businessId,
      categoryId: domain.categoryId,
      state: this.mapStateToDTO(domain.state),
      title: domain.title,
      description: domain.description,
      terms: domain.terms,
      discountType: this.mapDiscountTypeToDTO(domain.discountType),
      discountValue: domain.discountValue,
      currency: domain.currency,
      location: domain.location
        ? this.mapLocationToDTO(domain.location)
        : undefined,
      imageUrl: domain.imageUrl || undefined,
      validFrom: formatDate(domain.validFrom),
      expiresAt: formatDate(domain.expiresAt),
      maxRedemptions: domain.maxRedemptions || undefined,
      maxRedemptionsPerUser: domain.maxRedemptionsPerUser,
      currentRedemptions: domain.currentRedemptions,
      metadata: domain.metadata || undefined,
      createdAt: formatDate(domain.createdAt),
      updatedAt: formatDate(domain.updatedAt),
      codes: domain.codes?.map((code) => this.mapCodeToDTO(code)),
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms and handles date parsing
   */
  static fromDTO(dto: VoucherDTO): VoucherDomain {
    return {
      id: dto.id,
      businessId: dto.businessId,
      categoryId: dto.categoryId,
      state: mapVoucherState(dto.state),
      title: dto.title,
      description: dto.description,
      terms: dto.terms,
      discountType: mapVoucherDiscountType(dto.discountType),
      discountValue: dto.discountValue,
      currency: dto.currency,
      location: dto.location ? this.mapLocationFromDTO(dto.location) : null,
      imageUrl: dto.imageUrl || null,
      validFrom: new Date(dto.validFrom),
      expiresAt: new Date(dto.expiresAt),
      maxRedemptions: dto.maxRedemptions || null,
      maxRedemptionsPerUser: dto.maxRedemptionsPerUser,
      currentRedemptions: dto.currentRedemptions,
      metadata: dto.metadata || null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      codes: dto.codes?.map((code) => this.mapCodeFromDTO(code)),
    }
  }

  /**
   * Maps create DTO to domain data
   */
  static fromCreateDTO(dto: CreateVoucherDTO): CreateVoucherData {
    return {
      businessId: dto.businessId,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description,
      terms: dto.terms,
      discountType: mapVoucherDiscountType(dto.discountType),
      discountValue: dto.discountValue,
      currency: dto.currency,
      location: dto.location ? this.mapLocationFromDTO(dto.location) : null,
      imageUrl: dto.imageUrl || null,
      validFrom: new Date(dto.validFrom),
      expiresAt: new Date(dto.expiresAt),
      maxRedemptions: dto.maxRedemptions || null,
      maxRedemptionsPerUser: dto.maxRedemptionsPerUser,
      metadata: dto.metadata || null,
    }
  }

  /**
   * Maps update DTO to domain data
   */
  static fromUpdateDTO(dto: UpdateVoucherDTO): UpdateVoucherData {
    const result: UpdateVoucherData = {}

    if (dto.title !== undefined) result.title = dto.title
    if (dto.description !== undefined) result.description = dto.description
    if (dto.terms !== undefined) result.terms = dto.terms
    if (dto.discountType !== undefined)
      result.discountType = mapVoucherDiscountType(dto.discountType)
    if (dto.discountValue !== undefined)
      result.discountValue = dto.discountValue
    if (dto.currency !== undefined) result.currency = dto.currency
    if (dto.location !== undefined)
      result.location = dto.location
        ? this.mapLocationFromDTO(dto.location)
        : null
    if (dto.imageUrl !== undefined) result.imageUrl = dto.imageUrl || null
    if (dto.validFrom !== undefined) result.validFrom = new Date(dto.validFrom)
    if (dto.expiresAt !== undefined) result.expiresAt = new Date(dto.expiresAt)
    if (dto.maxRedemptions !== undefined)
      result.maxRedemptions = dto.maxRedemptions || null
    if (dto.maxRedemptionsPerUser !== undefined)
      result.maxRedemptionsPerUser = dto.maxRedemptionsPerUser
    if (dto.metadata !== undefined) result.metadata = dto.metadata || null

    return result
  }

  /**
   * Maps customer voucher document to domain
   */
  static mapCustomerVoucherFromDocument(
    doc: CustomerVoucherDocument,
  ): CustomerVoucherDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      voucherId: doc.voucherId,
      status: doc.status as 'claimed' | 'redeemed' | 'expired',
      claimedAt:
        doc.claimedAt instanceof Date
          ? doc.claimedAt
          : doc.claimedAt
            ? new Date(doc.claimedAt)
            : new Date(),
      redeemedAt: doc.redeemedAt
        ? doc.redeemedAt instanceof Date
          ? doc.redeemedAt
          : new Date(doc.redeemedAt)
        : null,
      expiresAt:
        doc.expiresAt instanceof Date
          ? doc.expiresAt
          : doc.expiresAt
            ? new Date(doc.expiresAt)
            : new Date(),
      redemptionCode: doc.redemptionCode,
      redemptionLocation: doc.redemptionLocation
        ? this.mapLocationFromDocument(doc.redemptionLocation)
        : null,
      metadata: doc.metadata,
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt
          : doc.createdAt
            ? new Date(doc.createdAt)
            : new Date(),
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt
          : doc.updatedAt
            ? new Date(doc.updatedAt)
            : new Date(),
      voucher: doc.voucher ? this.fromDocument(doc.voucher) : undefined,
    }
  }

  /**
   * Maps customer voucher domain to DTO
   */
  static mapCustomerVoucherToDTO(
    domain: CustomerVoucherDomain,
  ): CustomerVoucherDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      voucherId: domain.voucherId,
      status: domain.status,
      claimedAt: domain.claimedAt.toISOString(),
      redeemedAt: domain.redeemedAt?.toISOString() || undefined,
      expiresAt: domain.expiresAt.toISOString(),
      redemptionCode: domain.redemptionCode || undefined,
      redemptionLocation: domain.redemptionLocation
        ? this.mapLocationToDTO(domain.redemptionLocation)
        : undefined,
      metadata: domain.metadata || undefined,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      voucher: domain.voucher ? this.toDTO(domain.voucher) : undefined,
    }
  }

  // ============= Helper Methods =============

  /**
   * Maps location from document format
   */
  private static mapLocationFromDocument(
    location: any,
  ): VoucherLocation | null {
    if (!location) return null

    return {
      lat: location.lat || location.latitude || 0,
      lng: location.lng || location.longitude || 0,
      radius: location.radius,
    }
  }

  /**
   * Maps location to DTO format
   */
  private static mapLocationToDTO(
    location: VoucherLocation,
  ): VoucherLocationDTO {
    return {
      lat: location.lat,
      lng: location.lng,
      radius: location.radius,
    }
  }

  /**
   * Maps location from DTO format
   */
  private static mapLocationFromDTO(
    location: VoucherLocationDTO,
  ): VoucherLocation {
    return {
      lat: location.lat,
      lng: location.lng,
      radius: location.radius,
    }
  }

  /**
   * Maps voucher code from document format
   */
  private static mapCodeFromDocument(code: any): VoucherCode {
    return {
      id: code.id,
      code: code.code,
      type: code.type,
      isActive: code.isActive,
      metadata: code.metadata,
    }
  }

  /**
   * Maps voucher code to DTO format
   */
  private static mapCodeToDTO(code: VoucherCode): VoucherCodeDTO {
    return {
      id: code.id,
      code: code.code,
      type: code.type,
      isActive: code.isActive,
      metadata: code.metadata,
    }
  }

  /**
   * Maps voucher code from DTO format
   */
  private static mapCodeFromDTO(code: VoucherCodeDTO): VoucherCode {
    return {
      id: code.id,
      code: code.code,
      type: code.type,
      isActive: code.isActive,
      metadata: code.metadata,
    }
  }

  /**
   * Maps domain state to DTO state (API compatible)
   */
  private static mapStateToDTO(state: VoucherState): string {
    switch (state) {
      case VoucherState.draft:
        return VoucherState.draft
      case VoucherState.published:
        return VoucherState.published
      case VoucherState.claimed:
        return VoucherState.claimed
      case VoucherState.redeemed:
        return VoucherState.redeemed
      case VoucherState.expired:
        return VoucherState.expired
      case VoucherState.suspended:
        return VoucherState.suspended
      default:
        return VoucherState.draft
    }
  }

  /**
   * Maps domain discount type to DTO discount type (API compatible)
   */
  private static mapDiscountTypeToDTO(
    discountType: VoucherDiscountType,
  ): string {
    switch (discountType) {
      case VoucherDiscountType.percentage:
        return VoucherDiscountType.percentage
      case VoucherDiscountType.fixed:
        return VoucherDiscountType.fixed
      default:
        return VoucherDiscountType.fixed
    }
  }

  /**
   * Maps array of domains to DTOs
   */
  static toDTOArray(domains: VoucherDomain[]): VoucherDTO[] {
    return domains.map((domain) => this.toDTO(domain))
  }

  /**
   * Maps array of DTOs to domains
   */
  static fromDTOArray(dtos: VoucherDTO[]): VoucherDomain[] {
    return dtos.map((dto) => this.fromDTO(dto))
  }

  /**
   * Maps array of documents to domains
   */
  static fromDocumentArray(docs: VoucherDocument[]): VoucherDomain[] {
    return docs.map((doc) => this.fromDocument(doc))
  }
}
