import type {
  BusinessDetailsDomain,
  BusinessDomain,
  CreateBusinessData,
  UpdateBusinessData,
} from '../domain/business.js'
import type {
  BusinessDetailsDTO,
  BusinessDTO,
  CreateBusinessDTO,
  UpdateBusinessDTO,
} from '../dto/business.dto.js'
import { formatDateToISO } from '../utils/dateUtils.js'
import { type CategoryDocument, CategoryMapper } from './CategoryMapper.js'
import { type UserDocument, UserMapper } from './UserMapper.js'

/**
 * Interface representing a database BusinessDetails document
 */
export interface BusinessDetailsDocument {
  id: string
  businessId: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  street: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  operatingHours: any | null
  socialMedia: any | null
  additionalInfo: any | null
  createdAt: Date | null
  updatedAt: Date | null
}

/**
 * Interface representing a database Business document
 * Uses camelCase for fields as they come from Prisma
 */
export interface BusinessDocument {
  id: string
  userId: string
  businessNameKey: string
  businessDescriptionKey: string | null
  categoryId: string | null
  verified: boolean
  active: boolean
  approved: boolean
  approvedBy: string | null
  approvedAt: Date | null
  avgRating: number | string // Prisma Decimal comes as number or string
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
  // Optional relations
  user?: UserDocument | null
  category?: CategoryDocument | null
  businessDetails?: BusinessDetailsDocument | null
  businessRegistration?: {
    id: string
    userId: string
    businessId: string | null
    currentStep: number
    registrationStatus: string
    startedAt: Date
    completedAt: Date | null
    submittedAt: Date | null
    rejectionReason: string | null
    createdAt: Date
    updatedAt: Date
  } | null
}

/**
 * Business mapper that handles all transformations between database, domain, and DTO layers
 */
export class BusinessMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: BusinessDocument): BusinessDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      businessNameKey: doc.businessNameKey,
      businessDescriptionKey: doc.businessDescriptionKey,
      categoryId: doc.categoryId,
      verified: doc.verified,
      active: doc.active,
      approved: doc.approved,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt
        ? doc.approvedAt instanceof Date
          ? doc.approvedAt
          : new Date(doc.approvedAt)
        : null,
      avgRating: Number(doc.avgRating), // Convert Decimal to number
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
        : null,
      // Relations using existing mappers
      user: doc.user ? UserMapper.fromDocument(doc.user) : undefined,
      category: doc.category
        ? CategoryMapper.fromDocument(doc.category)
        : undefined,
      businessDetails: doc.businessDetails
        ? BusinessMapper.fromBusinessDetailsDocument(doc.businessDetails)
        : undefined,
      businessRegistration: doc.businessRegistration || undefined,
    }
  }

  /**
   * Maps a domain entity to an Admin API DTO
   * Admin responses include resolved translations when available
   */
  static toAdminDTO(domain: BusinessDomain): any {
    return {
      id: domain.id,
      userId: domain.userId,
      // Use resolved translations when available (populated by TranslationResolver)
      // Falls back to translation keys if translations weren't resolved
      businessName: domain.businessName || domain.businessNameKey,
      businessDescription:
        domain.businessDescription ||
        domain.businessDescriptionKey ||
        undefined,
      categoryId: domain.categoryId,
      verified: domain.verified,
      active: domain.active,
      approved: domain.approved,
      approvedBy: domain.approvedBy || null,
      approvedAt: domain.approvedAt ? formatDateToISO(domain.approvedAt) : null,
      avgRating: domain.avgRating,
      createdAt: formatDateToISO(domain.createdAt),
      updatedAt: formatDateToISO(domain.updatedAt),
      deletedAt: domain.deletedAt ? formatDateToISO(domain.deletedAt) : null,
      // Include logoUrl from businessDetails if available
      logoUrl: domain.businessDetails?.logoUrl || null,
      // Relations using existing mappers
      user: domain.user ? UserMapper.toAdminDTO(domain.user) : undefined,
      category: domain.category
        ? CategoryMapper.toDTO(domain.category)
        : undefined,
      businessDetails: domain.businessDetails
        ? BusinessMapper.toBusinessDetailsDTO(domain.businessDetails)
        : undefined,
      businessRegistration: domain.businessRegistration
        ? {
            id: domain.businessRegistration.id,
            registrationStatus: domain.businessRegistration.registrationStatus,
            currentStep: domain.businessRegistration.currentStep,
          }
        : undefined,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Public endpoints should show resolved translations when available
   */
  static toDTO(domain: BusinessDomain): BusinessDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      // Use resolved translations if available, fallback to keys for public endpoints
      businessName: domain.businessName || domain.businessNameKey,
      businessDescription:
        domain.businessDescription ||
        domain.businessDescriptionKey ||
        undefined,
      categoryId: domain.categoryId || '', // Handle null categoryId
      verified: domain.verified,
      active: domain.active,
      approved: domain.approved,
      avgRating: domain.avgRating,
      createdAt: formatDateToISO(domain.createdAt),
      updatedAt: formatDateToISO(domain.updatedAt),
      deletedAt: domain.deletedAt ? formatDateToISO(domain.deletedAt) : null,
      // Include logoUrl from businessDetails if available
      logoUrl: domain.businessDetails?.logoUrl || null,
      // Relations using existing mappers
      user: domain.user ? UserMapper.toDTO(domain.user) : undefined,
      category: domain.category
        ? CategoryMapper.toDTO(domain.category)
        : undefined,
      businessDetails: domain.businessDetails
        ? BusinessMapper.toBusinessDetailsDTO(domain.businessDetails)
        : undefined,
    }
  }

  /**
   * Maps an API DTO to a domain entity
   */
  static fromDTO(dto: BusinessDTO): BusinessDomain {
    return {
      id: dto.id,
      userId: dto.userId,
      businessNameKey: dto.businessName,
      businessDescriptionKey: dto.businessDescription || null,
      categoryId: dto.categoryId || null, // Handle empty string as null
      verified: dto.verified,
      active: dto.active,
      approved: false, // Default to false if not in DTO
      approvedBy: null, // Default to null if not in DTO
      approvedAt: null, // Default to null if not in DTO
      avgRating: dto.avgRating,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      // Relations using existing mappers
      user: dto.user ? UserMapper.fromDTO(dto.user) : undefined,
      category: dto.category ? CategoryMapper.fromDTO(dto.category) : undefined,
    }
  }

  /**
   * Maps create DTO to domain create data
   */
  static fromCreateDTO(dto: CreateBusinessDTO): CreateBusinessData {
    return {
      userId: dto.userId,
      businessNameKey: dto.businessNameKey,
      businessDescriptionKey: dto.businessDescriptionKey || null,
      categoryId: dto.categoryId,
      verified: dto.verified || false,
      active: dto.active || true,
    }
  }

  /**
   * Maps update DTO to domain update data
   */
  static fromUpdateDTO(dto: UpdateBusinessDTO): UpdateBusinessData {
    const updates: UpdateBusinessData = {}

    if (dto.businessNameKey !== undefined)
      updates.businessNameKey = dto.businessNameKey
    if (dto.businessDescriptionKey !== undefined)
      updates.businessDescriptionKey = dto.businessDescriptionKey
    if (dto.categoryId !== undefined) updates.categoryId = dto.categoryId
    if (dto.verified !== undefined) updates.verified = dto.verified
    if (dto.active !== undefined) updates.active = dto.active

    return updates
  }

  /**
   * Transform array of documents to array of domains
   */
  static fromDocumentArray(docs: BusinessDocument[]): BusinessDomain[] {
    return docs.map((doc) => this.fromDocument(doc))
  }

  /**
   * Transform array of domains to array of DTOs
   */
  static toDTOArray(domains: BusinessDomain[]): BusinessDTO[] {
    return domains.map((domain) => this.toDTO(domain))
  }

  /**
   * Maps a BusinessDetails document to domain entity
   */
  static fromBusinessDetailsDocument(
    doc: BusinessDetailsDocument,
  ): BusinessDetailsDomain {
    return {
      id: doc.id,
      businessId: doc.businessId,
      phone: doc.phone,
      email: doc.email,
      website: doc.website,
      logoUrl: doc.logoUrl,
      street: doc.street,
      city: doc.city,
      state: doc.state,
      postalCode: doc.postalCode,
      country: doc.country,
      operatingHours: doc.operatingHours,
      socialMedia: doc.socialMedia,
      additionalInfo: doc.additionalInfo,
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt
          : new Date(doc.createdAt!),
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt
          : new Date(doc.updatedAt!),
    }
  }

  /**
   * Maps BusinessDetails domain to DTO
   */
  static toBusinessDetailsDTO(
    domain: BusinessDetailsDomain,
  ): BusinessDetailsDTO {
    return {
      id: domain.id,
      businessId: domain.businessId,
      phone: domain.phone || undefined,
      email: domain.email || undefined,
      website: domain.website || undefined,
      logoUrl: domain.logoUrl || undefined,
      street: domain.street || undefined,
      city: domain.city || undefined,
      state: domain.state || undefined,
      postalCode: domain.postalCode || undefined,
      country: domain.country || undefined,
      operatingHours: domain.operatingHours || undefined,
      socialMedia: domain.socialMedia || undefined,
      additionalInfo: domain.additionalInfo || undefined,
      createdAt: formatDateToISO(domain.createdAt),
      updatedAt: formatDateToISO(domain.updatedAt),
    }
  }
}
