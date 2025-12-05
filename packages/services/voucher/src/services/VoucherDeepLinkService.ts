import {
  ANDROID_PACKAGE_ID,
  DEEP_LINK_BUSINESS_PATH,
  DEEP_LINK_DOMAIN_DEV,
  DEEP_LINK_DOMAIN_LOCAL,
  DEEP_LINK_DOMAIN_PROD,
  DEEP_LINK_SCHEME,
  DEEP_LINK_VOUCHER_PATH,
  IOS_APP_STORE_ID,
} from '@pika/environment'
import { logger } from '@pika/shared'
import {
  DeepLinkMode,
  type DeepLinkModeType,
  VoucherScanSource,
  type VoucherScanSourceType,
} from '@pika/types'

export interface VoucherDeepLinkOptions {
  voucherId: string
  validationCode?: string // Pre-generated validation code (optional)
  source?: VoucherScanSourceType
  campaign?: string
  businessId?: string
  trackingParams?: Record<string, string>
  mode?: DeepLinkModeType
  ttl?: number // TTL in seconds for validation code
  includeOfflineData?: boolean // For hybrid mode
}

export interface DeepLinkResult {
  deepLink: string
  universalLink: string
  qrPayload: string // The actual content for QR code
  metadata: {
    source: VoucherScanSourceType
    campaign?: string
    businessId?: string
    mode: DeepLinkModeType
    generatedAt: Date
  }
}

/**
 * Service for generating deep links for voucher QR codes
 * Replaces or complements JWT-based QR codes with app deep links
 */
export class VoucherDeepLinkService {
  private readonly environment: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
  }

  /**
   * Get the appropriate deep link domain based on environment
   */
  private getDeepLinkDomain(): string {
    switch (this.environment) {
      case 'production':
        return DEEP_LINK_DOMAIN_PROD
      case 'development':
        return DEEP_LINK_DOMAIN_DEV
      default:
        return DEEP_LINK_DOMAIN_LOCAL
    }
  }

  /**
   * Generate deep link for voucher QR code with validation code
   */
  async generateVoucherDeepLink(
    options: VoucherDeepLinkOptions,
  ): Promise<DeepLinkResult> {
    const {
      voucherId,
      validationCode,
      source = VoucherScanSource.QR,
      campaign,
      businessId,
      trackingParams = {},
      mode = DeepLinkMode.UNIVERSAL_LINK, // Default to URL-based (no more JWT default)
      includeOfflineData = false,
    } = options

    // Build query parameters
    const queryParams = new URLSearchParams({
      ...(validationCode && { c: validationCode }), // Add validation code if provided
      ...(source && { source }),
      ...(campaign && { utm_campaign: campaign }),
      ...(businessId && { bid: businessId }),
      ...trackingParams,
    })

    // For hybrid mode, add offline data
    if (includeOfflineData || mode === DeepLinkMode.HYBRID) {
      // Set offline flag to indicate the app should prepare for offline mode
      queryParams.set('offline', 'true')

      // TODO: Future implementation - Add actual compressed voucher data
      // This will enable true offline validation without server calls
      // Implementation steps:
      // 1. Fetch full voucher details
      // 2. Compress data (e.g., using zlib/gzip)
      // 3. Base64 encode for URL safety
      // 4. Add to queryParams.set('data', compressedData)
      // Example: queryParams.set('data', await this.getCompressedVoucherData(voucherId))
    }

    const queryString = queryParams.toString()
    const domain = this.getDeepLinkDomain()

    // Generate different link formats based on mode
    const deepLink = `${DEEP_LINK_SCHEME}:/${DEEP_LINK_VOUCHER_PATH}/${voucherId}${queryString ? `?${queryString}` : ''}`
    const universalLink = `${domain}${DEEP_LINK_VOUCHER_PATH}/${voucherId}${queryString ? `?${queryString}` : ''}`

    // Determine QR payload based on mode
    let qrPayload: string

    switch (mode) {
      case DeepLinkMode.CUSTOM_SCHEME:
        qrPayload = deepLink
        break
      case DeepLinkMode.UNIVERSAL_LINK:
        qrPayload = universalLink
        break
      case DeepLinkMode.JWT:
        // TODO: REMOVE AFTER MIGRATION - JWT mode deprecated
        throw new Error(
          'JWT mode is deprecated. Use URL-based validation codes instead.',
        )
      case DeepLinkMode.HYBRID:
        // Hybrid mode uses universal link with optional offline data
        qrPayload = universalLink
        break
      default:
        qrPayload = universalLink
    }

    logger.info('Generated voucher deep link', {
      voucherId,
      source,
      campaign,
      mode,
      domain,
    })

    return {
      deepLink,
      universalLink,
      qrPayload,
      metadata: {
        source,
        campaign,
        businessId,
        mode,
        generatedAt: new Date(),
      },
    }
  }

  /**
   * Generate deep link for business QR code
   */
  async generateBusinessDeepLink(
    businessId: string,
    options?: {
      source?: VoucherScanSourceType
      campaign?: string
      trackingParams?: Record<string, string>
    },
  ): Promise<DeepLinkResult> {
    const {
      source = VoucherScanSource.QR,
      campaign,
      trackingParams = {},
    } = options || {}

    const queryParams = new URLSearchParams({
      source,
      ...(campaign && { utm_campaign: campaign }),
      ...trackingParams,
    })

    const queryString = queryParams.toString()
    const domain = this.getDeepLinkDomain()

    const deepLink = `${DEEP_LINK_SCHEME}:/${DEEP_LINK_BUSINESS_PATH}/${businessId}?${queryString}`
    const universalLink = `${domain}${DEEP_LINK_BUSINESS_PATH}/${businessId}?${queryString}`

    logger.info('Generated business deep link', {
      businessId,
      source,
      campaign,
    })

    return {
      deepLink,
      universalLink,
      qrPayload: universalLink, // Always use universal link for businesses
      metadata: {
        source,
        campaign,
        businessId,
        mode: DeepLinkMode.UNIVERSAL_LINK,
        generatedAt: new Date(),
      },
    }
  }

  /**
   * Generate batch of deep links for voucher book printing
   * Note: Validation codes should be pre-generated for print batches
   */
  async generatePrintBatch(
    vouchers: Array<{
      voucherId: string
      validationCode?: string // Should be pre-generated with PRINT type
      businessId?: string
    }>,
    options?: {
      batchCode?: string
      campaign?: string
      ttl?: number // TTL for validation codes (1 year for print)
    },
  ): Promise<{
    batchCode: string
    vouchers: DeepLinkResult[]
  }> {
    const batchCode = options?.batchCode || `BATCH-${Date.now()}`

    const voucherLinks = await Promise.all(
      vouchers.map((voucher) =>
        this.generateVoucherDeepLink({
          voucherId: voucher.voucherId,
          validationCode: voucher.validationCode, // Use pre-generated code
          businessId: voucher.businessId,
          source: VoucherScanSource.PRINT,
          campaign: options?.campaign || 'print-batch',
          trackingParams: {
            batch: batchCode,
          },
          mode: DeepLinkMode.UNIVERSAL_LINK, // Always use universal links for print
          ttl: options?.ttl || 31536000, // 1 year default for print
        }),
      ),
    )

    logger.info('Generated print voucher batch', {
      batchCode,
      count: vouchers.length,
      campaign: options?.campaign,
    })

    return {
      batchCode,
      vouchers: voucherLinks,
    }
  }

  /**
   * Generate app store redirect URLs
   */
  getAppStoreUrls(): {
    ios: string
    android: string
  } {
    return {
      ios: IOS_APP_STORE_ID
        ? `https://apps.apple.com/app/the-voucherbook/id${IOS_APP_STORE_ID}`
        : 'https://apps.apple.com/app/the-voucherbook',
      android: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`,
    }
  }

  /**
   * Validate if a URL is a valid VoucherBook deep link
   */
  isValidDeepLink(url: string): boolean {
    try {
      const uri = new URL(url)

      // Check custom scheme
      if (uri.protocol === `${DEEP_LINK_SCHEME}:`) {
        return (
          uri.pathname.startsWith(DEEP_LINK_VOUCHER_PATH) ||
          uri.pathname.startsWith(DEEP_LINK_BUSINESS_PATH)
        )
      }

      // Check universal links
      const validDomains = [
        DEEP_LINK_DOMAIN_PROD,
        DEEP_LINK_DOMAIN_DEV,
        DEEP_LINK_DOMAIN_LOCAL,
      ]

      const origin = uri.origin

      return (
        validDomains.some((domain) => domain.startsWith(origin)) &&
        (uri.pathname.startsWith(DEEP_LINK_VOUCHER_PATH) ||
          uri.pathname.startsWith(DEEP_LINK_BUSINESS_PATH))
      )
    } catch {
      return false
    }
  }

  /**
   * Extract entity ID and type from deep link
   */
  parseDeepLink(url: string): {
    type: 'voucher' | 'business' | null
    id: string | null
    params: Record<string, string>
  } {
    try {
      const uri = new URL(url)
      const params = Object.fromEntries(uri.searchParams)

      // Handle custom scheme
      if (uri.protocol === `${DEEP_LINK_SCHEME}:`) {
        if (uri.pathname.startsWith(DEEP_LINK_VOUCHER_PATH)) {
          const id = uri.pathname.replace(DEEP_LINK_VOUCHER_PATH + '/', '')

          return { type: 'voucher', id, params }
        }
        if (uri.pathname.startsWith(DEEP_LINK_BUSINESS_PATH)) {
          const id = uri.pathname.replace(DEEP_LINK_BUSINESS_PATH + '/', '')

          return { type: 'business', id, params }
        }
      }

      // Handle universal links
      if (uri.pathname.startsWith(DEEP_LINK_VOUCHER_PATH)) {
        const parts = uri.pathname.split('/')

        return { type: 'voucher', id: parts[2] || null, params }
      }
      if (uri.pathname.startsWith(DEEP_LINK_BUSINESS_PATH)) {
        const parts = uri.pathname.split('/')

        return { type: 'business', id: parts[2] || null, params }
      }

      return { type: null, id: null, params }
    } catch {
      return { type: null, id: null, params: {} }
    }
  }
}

// Export singleton instance
export const voucherDeepLinkService = new VoucherDeepLinkService()
