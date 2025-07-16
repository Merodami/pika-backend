import type { UserRoleType, UserStatusType } from '@pika/types'
import { UserRole, UserStatus } from '@pika

import type { FriendDomain } from '../domain/social.js'
import type {
  AddressDomain,
  ParqDomain,
  PaymentMethodDomain,
  ProfessionalDomain,
  UserDomain,
} from '../domain/user.js'
import type { AddressDTO, PaymentMethodDTO, UserDTO } from '../dto/user.dto.js'

/**
 * Interface representing a database User document
 * Uses camelCase for fields as they come from Prisma
 */
export interface UserDocument {
  id: string
  email: string
  emailVerified: boolean
  password?: string | null
  firstName: string
  lastName: string
  phoneNumber: string | null
  phoneVerified: boolean
  avatarUrl: string | null
  role: string
  status: string
  lastLoginAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
  // Gym platform specific fields
  dateOfBirth?: Date | null
  alias?: string | null
  appVersion?: string | null
  activeMembership: boolean
  guests: string[]
  stripeUserId?: string | null
  // Relations
  professional?: ProfessionalDocument | null
  parq?: ParqDocument | null
  friends?: FriendDocument[]
}

/**
 * Interface for professional document
 */
export interface ProfessionalDocument {
  id: string
  userId: string
  description: string
  specialties: string[]
  favoriteGyms: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Interface for PARQ document
 */
export interface ParqDocument {
  id: string
  userId: string
  medicalClearance: boolean
  existingInjuries: boolean
  symptomsCheck: boolean
  doctorConsultation: boolean
  experienceLevel: boolean
  properTechnique: boolean
  gymEtiquette: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Interface for friend document
 */
export interface FriendDocument {
  id: string
  userId: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  type: 'FRIEND' | 'CLIENT'
  invitedAt: Date
  referredUserId?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Interface for address document
 */
export interface AddressDocument {
  id: string
  userId: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  location?: {
    latitude: number
    longitude: number
  } | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Interface for payment method document
 */
export interface PaymentMethodDocument {
  id: string
  userId: string
  paymentType: string
  cardBrand?: string | null
  lastFour?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Domain types are now imported from '../domain/user.js'

/**
 * Comprehensive User mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 */
export class UserMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: UserDocument): UserDomain {
    return {
      id: doc.id,
      email: doc.email,
      emailVerified: doc.emailVerified,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneNumber: doc.phoneNumber,
      phoneVerified: doc.phoneVerified,
      avatarUrl: doc.avatarUrl,
      role: this.mapRole(doc.role),
      status: this.mapStatus(doc.status),
      lastLoginAt: doc.lastLoginAt,
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
      // Gym platform specific fields
      dateOfBirth: doc.dateOfBirth
        ? doc.dateOfBirth instanceof Date
          ? doc.dateOfBirth
          : new Date(doc.dateOfBirth)
        : undefined,
      alias: doc.alias,
      appVersion: doc.appVersion,
      activeMembership: doc.activeMembership || false,
      guests: doc.guests || [],
      stripeUserId: doc.stripeUserId,
      // Relations
      professional: doc.professional
        ? this.mapProfessionalFromDocument(doc.professional)
        : undefined,
      parq: doc.parq ? this.mapParqFromDocument(doc.parq) : undefined,
      friends: doc.friends?.map((friend) => this.mapFriendFromDocument(friend)),
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: UserDomain): UserDTO {
    const formatDate = (
      date: Date | string | undefined | null,
    ): string | undefined => {
      if (!date) return undefined
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      return undefined
    }

    return {
      id: domain.id,
      email: domain.email,
      emailVerified: domain.emailVerified,
      firstName: domain.firstName,
      lastName: domain.lastName,
      phoneNumber: domain.phoneNumber || undefined,
      phoneVerified: domain.phoneVerified,
      avatarUrl: domain.avatarUrl || undefined,
      role: this.mapRoleToDTO(domain.role),
      status: this.mapStatusToDTO(domain.status),
      lastLoginAt: formatDate(domain.lastLoginAt),
      createdAt: formatDate(domain.createdAt) || new Date().toISOString(),
      updatedAt: formatDate(domain.updatedAt) || new Date().toISOString(),
      // Gym platform specific fields
      dateOfBirth: formatDate(domain.dateOfBirth),
      alias: domain.alias || undefined,
      appVersion: domain.appVersion || undefined,
      activeMembership: domain.activeMembership,
      guests: domain.guests,
      stripeUserId: domain.stripeUserId || undefined,
      // Relations
      professional: domain.professional
        ? this.mapProfessionalToDTO(domain.professional)
        : undefined,
      parq: domain.parq ? this.mapParqToDTO(domain.parq) : undefined,
      friends: domain.friends?.map((friend) => this.mapFriendToDTO(friend)),
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: UserDTO): UserDomain {
    return {
      id: dto.id,
      email: dto.email,
      emailVerified: dto.emailVerified,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber || null,
      phoneVerified: dto.phoneVerified,
      avatarUrl: dto.avatarUrl || null,
      role: this.mapRole(dto.role),
      status: this.mapStatus(dto.status),
      lastLoginAt: dto.lastLoginAt ? new Date(dto.lastLoginAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      // Gym platform specific fields
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      alias: dto.alias || null,
      appVersion: dto.appVersion || null,
      activeMembership: dto.activeMembership || false,
      guests: dto.guests || [],
      stripeUserId: dto.stripeUserId || null,
    }
  }

  /**
   * Maps address document to domain
   */
  static mapAddressFromDocument(doc: AddressDocument): AddressDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      addressLine1: doc.addressLine1,
      addressLine2: doc.addressLine2,
      city: doc.city,
      state: doc.state,
      postalCode: doc.postalCode,
      country: doc.country,
      isDefault: doc.isDefault,
      location: doc.location,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    }
  }

  /**
   * Maps address domain to DTO
   */
  static mapAddressToDTO(domain: AddressDomain): AddressDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      addressLine1: domain.addressLine1,
      addressLine2: domain.addressLine2 || undefined,
      city: domain.city,
      state: domain.state,
      postalCode: domain.postalCode,
      country: domain.country,
      isDefault: domain.isDefault,
      location: domain.location
        ? {
            lat: domain.location.latitude,
            lng: domain.location.longitude,
          }
        : undefined,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps payment method document to domain
   */
  static mapPaymentMethodFromDocument(
    doc: PaymentMethodDocument,
  ): PaymentMethodDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      paymentType: this.mapPaymentType(doc.paymentType),
      cardBrand: doc.cardBrand,
      lastFour: doc.lastFour,
      expiryMonth: doc.expiryMonth,
      expiryYear: doc.expiryYear,
      isDefault: doc.isDefault,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    }
  }

  /**
   * Maps payment method domain to DTO
   */
  static mapPaymentMethodToDTO(domain: PaymentMethodDomain): PaymentMethodDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      paymentType: domain.paymentType,
      cardBrand: domain.cardBrand || undefined,
      lastFour: domain.lastFour || undefined,
      expiryMonth: domain.expiryMonth || undefined,
      expiryYear: domain.expiryYear || undefined,
      isDefault: domain.isDefault,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps professional document to domain
   */
  static mapProfessionalFromDocument(
    doc: ProfessionalDocument,
  ): ProfessionalDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      description: doc.description,
      specialties: doc.specialties,
      favoriteGyms: doc.favoriteGyms,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    }
  }

  /**
   * Maps professional domain to DTO
   */
  static mapProfessionalToDTO(domain: ProfessionalDomain): any {
    return {
      id: domain.id,
      userId: domain.userId,
      description: domain.description,
      specialties: domain.specialties,
      favoriteGyms: domain.favoriteGyms,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps PARQ document to domain
   */
  static mapParqFromDocument(doc: ParqDocument): ParqDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      medicalClearance: doc.medicalClearance,
      existingInjuries: doc.existingInjuries,
      symptomsCheck: doc.symptomsCheck,
      doctorConsultation: doc.doctorConsultation,
      experienceLevel: doc.experienceLevel,
      properTechnique: doc.properTechnique,
      gymEtiquette: doc.gymEtiquette,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    }
  }

  /**
   * Maps PARQ domain to DTO
   */
  static mapParqToDTO(domain: ParqDomain): any {
    return {
      id: domain.id,
      userId: domain.userId,
      medicalClearance: domain.medicalClearance,
      existingInjuries: domain.existingInjuries,
      symptomsCheck: domain.symptomsCheck,
      doctorConsultation: domain.doctorConsultation,
      experienceLevel: domain.experienceLevel,
      properTechnique: domain.properTechnique,
      gymEtiquette: domain.gymEtiquette,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps friend document to domain
   */
  static mapFriendFromDocument(doc: FriendDocument): FriendDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      email: doc.email,
      name: doc.name,
      avatarUrl: doc.avatarUrl,
      type: doc.type,
      status: 'ACCEPTED', // Default status for existing friends
      message: null,
      userName: undefined,
      referredUserName: undefined,
      invitedAt:
        doc.invitedAt instanceof Date ? doc.invitedAt : new Date(doc.invitedAt),
      referredUserId: doc.referredUserId || '',
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    }
  }

  /**
   * Maps friend domain to DTO
   */
  static mapFriendToDTO(domain: FriendDomain): any {
    return {
      id: domain.id,
      userId: domain.userId,
      email: domain.email,
      name: domain.name || undefined,
      avatarUrl: domain.avatarUrl || undefined,
      type: domain.type,
      invitedAt: domain.invitedAt.toISOString(),
      referredUserId: domain.referredUserId || undefined,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps role string to enum
   */
  private static mapRole(role: string): UserRoleType {
    switch (role) {
      case UserRole.ADMIN:
        return UserRole.ADMIN
      case UserRole.MEMBER:
        return UserRole.MEMBER
      case UserRole.PROFESSIONAL:
        return UserRole.PROFESSIONAL
      case UserRole.THERAPIST:
        return UserRole.THERAPIST
      case UserRole.CONTENT_CREATOR:
        return UserRole.CONTENT_CREATOR
      default:
        return UserRole.MEMBER
    }
  }

  /**
   * Maps status string to enum
   */
  private static mapStatus(status: string): UserStatusType {
    switch (status) {
      case UserStatus.ACTIVE:
        return UserStatus.ACTIVE
      case UserStatus.INACTIVE:
        return UserStatus.INACTIVE
      case UserStatus.BANNED:
        return UserStatus.BANNED
      case UserStatus.UNCONFIRMED:
        return UserStatus.UNCONFIRMED
      default:
        return UserStatus.ACTIVE
    }
  }

  /**
   * Maps payment type string to enum
   */
  private static mapPaymentType(
    type: string,
  ): 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH' {
    switch (type) {
      case 'CREDIT_CARD':
        return 'CREDIT_CARD'
      case 'DEBIT_CARD':
        return 'DEBIT_CARD'
      case 'BANK_TRANSFER':
        return 'BANK_TRANSFER'
      case 'CASH':
        return 'CASH'
      default:
        return 'CASH'
    }
  }

  /**
   * Maps domain role to DTO role (API compatible)
   */
  private static mapRoleToDTO(role: string): any {
    // Return the role as-is since we support all role types
    switch (role) {
      case UserRole.ADMIN:
        return UserRole.ADMIN
      case UserRole.MEMBER:
        return UserRole.MEMBER
      case UserRole.PROFESSIONAL:
        return UserRole.PROFESSIONAL
      case UserRole.THERAPIST:
        return UserRole.THERAPIST
      case UserRole.CONTENT_CREATOR:
        return UserRole.CONTENT_CREATOR
      default:
        return role
    }
  }

  /**
   * Maps domain status to DTO status (API compatible)
   * UNCONFIRMED is mapped to SUSPENDED for API compatibility
   */
  private static mapStatusToDTO(status: string): UserStatusType {
    switch (status) {
      case UserStatus.ACTIVE:
        return UserStatus.ACTIVE
      case UserStatus.INACTIVE:
        return UserStatus.INACTIVE
      case UserStatus.UNCONFIRMED:
        return UserStatus.UNCONFIRMED
      case UserStatus.BANNED:
        return UserStatus.BANNED
      default:
        return UserStatus.ACTIVE
    }
  }
}
