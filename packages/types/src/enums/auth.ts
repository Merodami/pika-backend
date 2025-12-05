/**
 * Authentication and authorization related enums
 */

/**
 * JWT token types
 */
export enum TokenType {
  ACCESS_TOKEN = 'accessToken',
  REFRESH_TOKEN = 'refreshToken',
}

/**
 * Token format types (for Bearer tokens, etc.)
 */
export enum TokenFormat {
  BEARER = 'Bearer',
  BASIC = 'Basic',
  API_KEY = 'ApiKey',
}

export enum GrantType {
  PASSWORD = 'password',
  REFRESH_TOKEN = 'refreshToken',
  CLIENT_CREDENTIALS = 'clientCredentials',
  AUTHORIZATION_CODE = 'authorizationCode',
  IMPLICIT = 'implicit',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
}

// Keep OAuthProvider for backward compatibility
export { AuthProvider as OAuthProvider }

/**
 * Social authentication providers (subset of AuthProvider)
 */
export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

export enum OAuthError {
  INVALID_REQUEST = 'invalidRequest',
  INVALID_CLIENT = 'invalidClient',
  INVALID_GRANT = 'invalidGrant',
  UNAUTHORIZED_CLIENT = 'unauthorizedClient',
  UNSUPPORTED_GRANT_TYPE = 'unsupportedGrantType',
  INVALID_SCOPE = 'invalidScope',
  SERVER_ERROR = 'serverError',
  TEMPORARILY_UNAVAILABLE = 'temporarilyUnavailable',
}

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  DESKTOP = 'desktop',
}

/**
 * Session status
 */
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  INVALID = 'invalid',
}

/**
 * Registration source to determine user role
 */
export enum RegistrationSource {
  PUBLIC = 'public',
  ADMIN_DASHBOARD = 'adminDashboard',
}

/**
 * Multi-factor authentication methods
 * Matches Prisma enum in identity schema
 */
export enum MfaMethod {
  SMS = 'sms',
  TOTP = 'totp',
  EMAIL = 'email',
  BACKUP_CODES = 'backup_codes',
}
