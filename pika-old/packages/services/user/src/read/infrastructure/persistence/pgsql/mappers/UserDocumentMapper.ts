import {
  type Address,
  type PaymentMethod,
  User,
  type UserRole,
  type UserStatus,
} from '@user-read/domain/entities/User.js'

/**
 * Database document structure for User
 * Matches the Prisma schema with snake_case fields
 */
export interface UserDocument {
  id: string
  email: string
  email_verified: boolean
  first_name: string
  last_name: string
  phone_number: string | null
  phone_verified: boolean
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  addresses?: AddressDocument[]
  payment_methods?: PaymentMethodDocument[]
}

/**
 * Address document structure from database
 */
export interface AddressDocument {
  id: string
  user_id: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  location?: {
    latitude: number
    longitude: number
  }
  created_at: Date
  updated_at: Date
}

/**
 * PaymentMethod document structure from database
 */
export interface PaymentMethodDocument {
  id: string
  user_id: string
  payment_type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH'
  card_brand?: string
  last_four?: string
  expiry_month?: number
  expiry_year?: number
  is_default: boolean
  created_at: Date
  updated_at: Date
}

/**
 * Maps between database documents and domain entities
 * Following Admin Service pattern - NO SDK dependencies
 */
export class UserDocumentMapper {
  /**
   * Map address document to domain format
   */
  private static mapAddressDocumentToDomain(address: AddressDocument): Address {
    return {
      id: address.id,
      userId: address.user_id,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      isDefault: address.is_default,
      location: address.location,
      createdAt: new Date(address.created_at),
      updatedAt: new Date(address.updated_at),
    }
  }

  /**
   * Map payment method document to domain format
   */
  private static mapPaymentMethodDocumentToDomain(
    paymentMethod: PaymentMethodDocument,
  ): PaymentMethod {
    return {
      id: paymentMethod.id,
      userId: paymentMethod.user_id,
      paymentType: paymentMethod.payment_type,
      cardBrand: paymentMethod.card_brand,
      lastFour: paymentMethod.last_four,
      expiryMonth: paymentMethod.expiry_month,
      expiryYear: paymentMethod.expiry_year,
      isDefault: paymentMethod.is_default,
      createdAt: new Date(paymentMethod.created_at),
      updatedAt: new Date(paymentMethod.updated_at),
    }
  }

  /**
   * Map database document to domain entity
   * Handles both snake_case (from DB) and camelCase formats
   */
  static mapDocumentToDomain(document: UserDocument | any): User {
    // Handle both snake_case and camelCase field names
    const id = document.id
    const email = document.email
    const emailVerified =
      document.email_verified ?? document.emailVerified ?? false
    const firstName = document.first_name ?? document.firstName
    const lastName = document.last_name ?? document.lastName
    const phoneNumber = document.phone_number ?? document.phoneNumber ?? null
    const phoneVerified =
      document.phone_verified ?? document.phoneVerified ?? false
    const avatarUrl = document.avatar_url ?? document.avatarUrl ?? null
    const role = document.role
    const status = document.status
    const lastLoginAt = document.last_login_at ?? document.lastLoginAt
    const createdAt = document.created_at ?? document.createdAt
    const updatedAt = document.updated_at ?? document.updatedAt
    const deletedAt = document.deleted_at ?? document.deletedAt

    // Map addresses if present
    const addresses = document.addresses
      ? document.addresses.map((addr: AddressDocument) =>
          this.mapAddressDocumentToDomain(addr),
        )
      : undefined

    // Map payment methods if present
    const paymentMethods =
      (document.payment_methods ?? document.paymentMethods)
        ? (document.payment_methods ?? document.paymentMethods).map(
            (pm: PaymentMethodDocument) =>
              this.mapPaymentMethodDocumentToDomain(pm),
          )
        : undefined

    return User.create({
      id,
      email,
      emailVerified,
      firstName,
      lastName,
      phoneNumber,
      phoneVerified,
      avatarUrl,
      role,
      status,
      lastLoginAt: lastLoginAt ? new Date(lastLoginAt) : null,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      deletedAt: deletedAt ? new Date(deletedAt) : null,
      addresses,
      paymentMethods,
    })
  }

  /**
   * Map multiple documents to domain entities
   */
  static mapDocumentsToDomain(documents: UserDocument[]): User[] {
    return documents.map((doc) => this.mapDocumentToDomain(doc))
  }

  /**
   * Map domain entity to database document format
   * Converts to snake_case for database
   */
  static mapDomainToDocument(user: User): Partial<UserDocument> {
    const data = user.toObject()

    return {
      id: data.id,
      email: data.email,
      email_verified: data.emailVerified,
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.phoneNumber,
      phone_verified: data.phoneVerified,
      avatar_url: data.avatarUrl,
      role: data.role,
      status: data.status,
      last_login_at: data.lastLoginAt,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
      deleted_at: data.deletedAt,
    }
  }

  /**
   * Map address domain to document format
   */
  static mapAddressDomainToDocument(
    address: Address,
  ): Partial<AddressDocument> {
    return {
      id: address.id,
      user_id: address.userId,
      address_line1: address.addressLine1,
      address_line2: address.addressLine2,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country,
      is_default: address.isDefault,
      location: address.location,
      created_at: address.createdAt,
      updated_at: address.updatedAt,
    }
  }

  /**
   * Map payment method domain to document format
   */
  static mapPaymentMethodDomainToDocument(
    paymentMethod: PaymentMethod,
  ): Partial<PaymentMethodDocument> {
    return {
      id: paymentMethod.id,
      user_id: paymentMethod.userId,
      payment_type: paymentMethod.paymentType,
      card_brand: paymentMethod.cardBrand,
      last_four: paymentMethod.lastFour,
      expiry_month: paymentMethod.expiryMonth,
      expiry_year: paymentMethod.expiryYear,
      is_default: paymentMethod.isDefault,
      created_at: paymentMethod.createdAt,
      updated_at: paymentMethod.updatedAt,
    }
  }
}
