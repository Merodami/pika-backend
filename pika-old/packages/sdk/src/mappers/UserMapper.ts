import { Address } from '../openapi/models/Address.js'
import { PaymentMethod } from '../openapi/models/PaymentMethod.js'
import { UserProfile } from '../openapi/models/UserProfile.js'

/**
 * Interface representing a database User document
 * Uses camelCase for fields as they come from Prisma
 */
export interface UserDocument {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber: string | null
  phoneVerified: boolean
  avatarUrl: string | null
  role: string
  status: string
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  addresses?: AddressDocument[]
  paymentMethods?: PaymentMethodDocument[]
  customer?: CustomerDocument
  provider?: ProviderDocument
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

/**
 * Interface for customer document
 */
export interface CustomerDocument {
  id: string
  userId: string
  preferences?: any
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

/**
 * Interface for service provider document
 */
export interface ProviderDocument {
  id: string
  userId: string
  businessName: { [lang: string]: string }
  businessDescription: { [lang: string]: string }
  categoryId: string
  verified: boolean
  active: boolean
  avgRating?: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string | null
    role: string
    status: string
    avatarUrl?: string | null
  }
}

/**
 * Interface representing a domain User entity
 * This is the central domain model used across the application
 */
export interface UserDomain {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber: string | null
  phoneVerified: boolean
  avatarUrl: string | null
  role: 'ADMIN' | 'CUSTOMER' | 'PROVIDER'
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  addresses?: AddressDomain[]
  paymentMethods?: PaymentMethodDomain[]
  customer?: CustomerDomain
  provider?: ProviderDomain
}

/**
 * Interface for address domain entity
 */
export interface AddressDomain {
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
 * Interface for payment method domain entity
 */
export interface PaymentMethodDomain {
  id: string
  userId: string
  paymentType: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH'
  cardBrand?: string | null
  lastFour?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Interface for customer domain entity
 */
export interface CustomerDomain {
  id: string
  userId: string
  preferences?: any
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

/**
 * Interface for service provider domain entity
 */
export interface ProviderDomain {
  id: string
  userId: string
  businessName: { [lang: string]: string }
  businessDescription: { [lang: string]: string }
  categoryId: string
  verified: boolean
  active: boolean
  avgRating?: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string | null
    role: string
    status: string
    avatarUrl?: string | null
  }
}

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
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneNumber: doc.phoneNumber,
      phoneVerified: doc.phoneVerified,
      avatarUrl: doc.avatarUrl,
      role: this.mapRole(doc.role),
      status: this.mapStatus(doc.status),
      lastLoginAt: doc.lastLoginAt,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
      deletedAt: doc.deletedAt
        ? doc.deletedAt instanceof Date
          ? doc.deletedAt
          : new Date(doc.deletedAt)
        : undefined,
      addresses: doc.addresses?.map((addr) =>
        this.mapAddressFromDocument(addr),
      ),
      paymentMethods: doc.paymentMethods?.map((pm) =>
        this.mapPaymentMethodFromDocument(pm),
      ),
      customer: doc.customer
        ? this.mapCustomerFromDocument(doc.customer)
        : undefined,
      provider: doc.provider
        ? this.mapProviderFromDocument(doc.provider)
        : undefined,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Handles both UserDomain interface and User class instances
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: UserDomain | any): UserProfile {
    const formatDate = (
      date: Date | string | undefined | null,
    ): string | undefined => {
      if (!date) return undefined
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      return undefined
    }

    // Handle both User class instances (with getters) and UserDomain interfaces
    // Note: getters are properties, not functions, so we access them directly
    const getId = domain.getId !== undefined ? domain.getId : domain.id
    const getEmail =
      domain.getEmail !== undefined ? domain.getEmail : domain.email
    const getEmailVerified =
      domain.getEmailVerified !== undefined
        ? domain.getEmailVerified
        : domain.emailVerified
    const getFirstName =
      domain.getFirstName !== undefined ? domain.getFirstName : domain.firstName
    const getLastName =
      domain.getLastName !== undefined ? domain.getLastName : domain.lastName
    const getPhoneNumber =
      domain.getPhoneNumber !== undefined
        ? domain.getPhoneNumber
        : domain.phoneNumber
    const getPhoneVerified =
      domain.getPhoneVerified !== undefined
        ? domain.getPhoneVerified
        : domain.phoneVerified
    const getAvatarUrl =
      domain.getAvatarUrl !== undefined ? domain.getAvatarUrl : domain.avatarUrl
    const getRole = domain.getRole !== undefined ? domain.getRole : domain.role
    const getStatus =
      domain.getStatus !== undefined ? domain.getStatus : domain.status
    const getLastLoginAt =
      domain.getLastLoginAt !== undefined
        ? domain.getLastLoginAt
        : domain.lastLoginAt
    const getCreatedAt =
      domain.getCreatedAt !== undefined ? domain.getCreatedAt : domain.createdAt
    const getUpdatedAt =
      domain.getUpdatedAt !== undefined ? domain.getUpdatedAt : domain.updatedAt

    return {
      id: getId,
      email: getEmail,
      email_verified: getEmailVerified,
      first_name: getFirstName,
      last_name: getLastName,
      phone_number: getPhoneNumber || undefined,
      phone_verified: getPhoneVerified,
      avatar_url: getAvatarUrl || undefined,
      role: getRole,
      status: getStatus,
      last_login_at: formatDate(getLastLoginAt),
      created_at: formatDate(getCreatedAt) || new Date().toISOString(),
      updated_at: formatDate(getUpdatedAt) || new Date().toISOString(),
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: UserProfile): UserDomain {
    return {
      id: dto.id,
      email: dto.email,
      emailVerified: dto.email_verified,
      firstName: dto.first_name,
      lastName: dto.last_name,
      phoneNumber: dto.phone_number || null,
      phoneVerified: dto.phone_verified,
      avatarUrl: dto.avatar_url || null,
      role: dto.role,
      status: dto.status,
      lastLoginAt: dto.last_login_at ? new Date(dto.last_login_at) : null,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
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
  static mapAddressToDTO(domain: AddressDomain): Address {
    return {
      id: domain.id,
      user_id: domain.userId,
      address_line1: domain.addressLine1,
      address_line2: domain.addressLine2 || undefined,
      city: domain.city,
      state: domain.state,
      postal_code: domain.postalCode,
      country: domain.country,
      is_default: domain.isDefault,
      location: domain.location
        ? {
            lat: domain.location.latitude,
            lng: domain.location.longitude,
          }
        : undefined,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
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
  static mapPaymentMethodToDTO(domain: PaymentMethodDomain): PaymentMethod {
    return {
      id: domain.id,
      user_id: domain.userId,
      payment_type: domain.paymentType,
      card_brand: domain.cardBrand || undefined,
      last_four: domain.lastFour || undefined,
      expiry_month: domain.expiryMonth || undefined,
      expiry_year: domain.expiryYear || undefined,
      is_default: domain.isDefault,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps customer document to domain
   */
  static mapCustomerFromDocument(doc: CustomerDocument): CustomerDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      preferences: doc.preferences,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
      deletedAt: doc.deletedAt
        ? doc.deletedAt instanceof Date
          ? doc.deletedAt
          : new Date(doc.deletedAt)
        : undefined,
    }
  }

  /**
   * Maps service provider document to domain
   */
  static mapProviderFromDocument(doc: ProviderDocument): ProviderDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      businessName: doc.businessName,
      businessDescription: doc.businessDescription,
      categoryId: doc.categoryId,
      verified: doc.verified,
      active: doc.active,
      avgRating: doc.avgRating,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
      deletedAt: doc.deletedAt
        ? doc.deletedAt instanceof Date
          ? doc.deletedAt
          : new Date(doc.deletedAt)
        : undefined,
    }
  }

  /**
   * Maps role string to enum
   */
  private static mapRole(role: string): 'ADMIN' | 'CUSTOMER' | 'PROVIDER' {
    switch (role) {
      case 'ADMIN':
        return 'ADMIN'
      case 'CUSTOMER':
        return 'CUSTOMER'
      case 'PROVIDER':
        return 'PROVIDER'
      default:
        return 'CUSTOMER'
    }
  }

  /**
   * Maps status string to enum
   */
  private static mapStatus(status: string): 'ACTIVE' | 'SUSPENDED' | 'BANNED' {
    switch (status) {
      case 'ACTIVE':
        return 'ACTIVE'
      case 'SUSPENDED':
        return 'SUSPENDED'
      case 'BANNED':
        return 'BANNED'
      default:
        return 'ACTIVE'
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
}
