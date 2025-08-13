export enum AccountType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export enum ThemePreference {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

export enum UserSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Internal verification type (service-to-service)
 * Different from the public VerificationType
 */
export enum InternalVerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  IDENTITY = 'identity',
}
