import type { Response } from 'express'

/**
 * Cookie configuration options
 */
export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  domain?: string
  path?: string
}

/**
 * Default cookie options for different environments
 */
const getDefaultOptions = (isProduction: boolean): CookieOptions => ({
  httpOnly: true, // Prevent XSS attacks
  secure: isProduction, // HTTPS only in production
  sameSite: 'strict', // CSRF protection
  path: '/', // Available across the site
  maxAge: 24 * 60 * 60 * 1000, // 24 hours default
})

/**
 * Reusable cookie manager for consistent cookie handling across the application
 */
export class CookieManager {
  private static readonly COOKIE_NAMES = {
    // Authentication
    ACCESS_TOKEN: 'pika-access-token',
    REFRESH_TOKEN: 'pika-refresh-token',

    // User info
    USER_ID: 'user-id',
    USER_ROLE: 'user-role',
    USER_TIER: 'user-tier',

    // Business registration
    NEEDS_REGISTRATION: 'needs-business-registration',
    REGISTRATION_STEP: 'registration-step',
    BUSINESS_ID: 'business-id',

    // Session
    SESSION_ID: 'session-id',
    LOCALE: 'locale',
  } as const

  private readonly isProduction: boolean
  private readonly defaultOptions: CookieOptions

  constructor(isProduction = process.env.NODE_ENV === 'production') {
    this.isProduction = isProduction
    this.defaultOptions = getDefaultOptions(isProduction)
  }

  /**
   * Set a cookie with proper security options
   */
  setCookie(
    res: Response,
    name: string,
    value: string | boolean | number,
    options?: CookieOptions,
  ): void {
    const cookieOptions = {
      ...this.defaultOptions,
      ...options,
    }

    res.cookie(name, String(value), cookieOptions)
  }

  /**
   * Set multiple cookies at once
   */
  setCookies(
    res: Response,
    cookies: Record<string, string | boolean | number>,
    options?: CookieOptions,
  ): void {
    Object.entries(cookies).forEach(([name, value]) => {
      this.setCookie(res, name, value, options)
    })
  }

  /**
   * Clear a cookie
   */
  clearCookie(res: Response, name: string): void {
    res.clearCookie(name, {
      path: this.defaultOptions.path,
      domain: this.defaultOptions.domain,
    })
  }

  /**
   * Clear multiple cookies
   */
  clearCookies(res: Response, names: string[]): void {
    names.forEach((name) => this.clearCookie(res, name))
  }

  // Specific cookie setters for type safety and consistency

  /**
   * Set authentication cookies after successful login
   */
  setAuthCookies(
    res: Response,
    data: {
      accessToken: string
      refreshToken?: string
      userId: string
      userRole: string
      needsBusinessRegistration?: boolean
    },
  ): void {
    this.setCookies(res, {
      [CookieManager.COOKIE_NAMES.ACCESS_TOKEN]: data.accessToken,
      [CookieManager.COOKIE_NAMES.USER_ID]: data.userId,
      [CookieManager.COOKIE_NAMES.USER_ROLE]: data.userRole,
    })

    if (data.refreshToken) {
      this.setCookie(
        res,
        CookieManager.COOKIE_NAMES.REFRESH_TOKEN,
        data.refreshToken,
        { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days for refresh token
      )
    }

    // Set business registration status if user is a business owner
    if (
      data.userRole === 'business' &&
      data.needsBusinessRegistration !== undefined
    ) {
      this.setCookie(
        res,
        CookieManager.COOKIE_NAMES.NEEDS_REGISTRATION,
        data.needsBusinessRegistration,
      )
    }
  }

  /**
   * Update business registration status
   */
  setRegistrationStatus(
    res: Response,
    data: {
      needsRegistration: boolean
      currentStep?: number
      businessId?: string
    },
  ): void {
    this.setCookie(
      res,
      CookieManager.COOKIE_NAMES.NEEDS_REGISTRATION,
      data.needsRegistration,
    )

    if (data.currentStep !== undefined) {
      this.setCookie(
        res,
        CookieManager.COOKIE_NAMES.REGISTRATION_STEP,
        data.currentStep,
      )
    }

    if (data.businessId) {
      this.setCookie(
        res,
        CookieManager.COOKIE_NAMES.BUSINESS_ID,
        data.businessId,
      )
    }
  }

  /**
   * Clear registration-related cookies after completion
   */
  clearRegistrationCookies(res: Response): void {
    this.clearCookies(res, [
      CookieManager.COOKIE_NAMES.NEEDS_REGISTRATION,
      CookieManager.COOKIE_NAMES.REGISTRATION_STEP,
    ])
  }

  /**
   * Clear all auth-related cookies on logout
   */
  clearAuthCookies(res: Response): void {
    this.clearCookies(res, [
      CookieManager.COOKIE_NAMES.ACCESS_TOKEN,
      CookieManager.COOKIE_NAMES.REFRESH_TOKEN,
      CookieManager.COOKIE_NAMES.USER_ID,
      CookieManager.COOKIE_NAMES.USER_ROLE,
      CookieManager.COOKIE_NAMES.USER_TIER,
      CookieManager.COOKIE_NAMES.NEEDS_REGISTRATION,
      CookieManager.COOKIE_NAMES.BUSINESS_ID,
      CookieManager.COOKIE_NAMES.SESSION_ID,
    ])
  }

  /**
   * Get cookie names for use in other parts of the application
   */
  static getCookieNames() {
    return { ...CookieManager.COOKIE_NAMES }
  }
}

// Export singleton instance for convenience
export const cookieManager = new CookieManager()

// Export cookie names for use in middleware
export const COOKIE_NAMES = CookieManager.getCookieNames()
