import {
  VOUCHER_CODE_ALPHABET,
  VOUCHER_JWT_ALGORITHM,
  VOUCHER_JWT_PRIVATE_KEY,
  VOUCHER_SHORT_CODE_LENGTH,
} from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { nth, range } from 'lodash-es'

export interface CodeConfig {
  generateQR?: boolean
  generateShortCode?: boolean
  generateStaticCode?: boolean
  staticCode?: string
  // Also accept the snake_case version from API
  generate_qr?: boolean
  generate_short_code?: boolean
  generate_static_code?: boolean
}

export interface VoucherCode {
  code: string
  type: 'QR' | 'SHORT' | 'STATIC'
  metadata?: Record<string, any>
}

/**
 * Generates a cryptographically secure random short code
 * Uses configurable alphabet for human-friendly codes
 */
function generateShortCode(): string {
  const length = VOUCHER_SHORT_CODE_LENGTH
  const alphabet = VOUCHER_CODE_ALPHABET
  const bytes = randomBytes(length)

  let code = ''

  for (const i of range(length)) {
    const byteValue = nth(Array.from(bytes), i) || 0
    const index = byteValue % alphabet.length
    const char = nth(alphabet, index)

    if (char) {
      code += char
    }
  }

  return code
}

/**
 * Generates a JWT token for QR codes
 * Uses configurable algorithm (HS256 for dev, ES256 for production)
 */
function generateQRToken(voucherId: string): string {
  const payload = {
    type: 'voucher',
    vid: voucherId, // Short property names for smaller QR codes
    iat: Math.floor(Date.now() / 1000),
  }

  try {
    return jwt.sign(payload, VOUCHER_JWT_PRIVATE_KEY, {
      algorithm: VOUCHER_JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: '365d', // Vouchers have their own expiration logic
    })
  } catch (error) {
    throw ErrorFactory.fromError(error, 'Failed to generate QR token', {
      source: 'generateQRToken',
    })
  }
}

/**
 * Generates voucher codes based on configuration
 */
export async function generateVoucherCodes(
  config?: CodeConfig,
  voucherId?: string,
): Promise<VoucherCode[]> {
  const codes: VoucherCode[] = []

  // Default to generating both QR and short codes if no config provided
  const defaultConfig: CodeConfig = {
    generateQR: true,
    generateShortCode: true,
    generateStaticCode: false,
  }

  const finalConfig = {
    ...defaultConfig,
    ...config,
    // Map snake_case to camelCase for compatibility
    generateQR:
      config?.generateQR ?? config?.generate_qr ?? defaultConfig.generateQR,
    generateShortCode:
      config?.generateShortCode ??
      config?.generate_short_code ??
      defaultConfig.generateShortCode,
    generateStaticCode:
      config?.generateStaticCode ??
      config?.generate_static_code ??
      defaultConfig.generateStaticCode,
  }

  try {
    // Generate QR code (JWT token)
    if (finalConfig.generateQR && voucherId) {
      const qrToken = generateQRToken(voucherId)

      codes.push({
        code: qrToken,
        type: 'QR',
        metadata: {
          algorithm: VOUCHER_JWT_ALGORITHM,
          generatedAt: new Date().toISOString(),
        },
      })
      logger.debug('Generated QR code for voucher', {
        voucherId,
        tokenLength: qrToken.length,
      })
    }

    // Generate short code
    if (finalConfig.generateShortCode) {
      const shortCode = generateShortCode()

      codes.push({
        code: shortCode,
        type: 'SHORT',
        metadata: {
          length: shortCode.length,
          generatedAt: new Date().toISOString(),
        },
      })
      logger.debug('Generated short code', { code: shortCode })
    }

    // Add static code if provided
    if (finalConfig.generateStaticCode && finalConfig.staticCode) {
      // Validate static code format
      if (!/^[A-Z0-9]{4,20}$/.test(finalConfig.staticCode)) {
        throw ErrorFactory.validationError(
          {
            staticCode: [
              'Static code must be 4-20 characters, uppercase letters and numbers only',
            ],
          },
          { source: 'generateVoucherCodes' },
        )
      }

      codes.push({
        code: finalConfig.staticCode,
        type: 'STATIC',
        metadata: {
          userProvided: true,
          generatedAt: new Date().toISOString(),
        },
      })
      logger.debug('Added static code', { code: finalConfig.staticCode })
    }

    return codes
  } catch (error) {
    logger.error('Error generating voucher codes', error)
    throw ErrorFactory.fromError(error, 'Failed to generate voucher codes')
  }
}

/**
 * Validates a voucher code format
 */
export function validateVoucherCode(
  code: string,
  type: VoucherCode['type'],
): boolean {
  switch (type) {
    case 'QR':
      // Validate JWT format
      try {
        const parts = code.split('.')

        return parts.length === 3 // Basic JWT validation
      } catch {
        return false
      }

    case 'SHORT': {
      // Validate short code format
      // Check length first
      if (code.length !== VOUCHER_SHORT_CODE_LENGTH) {
        return false
      }

      // Check each character is in the allowed alphabet
      for (const char of code) {
        if (!VOUCHER_CODE_ALPHABET.includes(char)) {
          return false
        }
      }

      return true
    }

    case 'STATIC':
      // Validate static code format
      return /^[A-Z0-9]{4,20}$/.test(code)

    default:
      return false
  }
}

/**
 * Decodes a QR token to extract voucher information
 */
export function decodeQRToken(token: string): { voucherId: string } | null {
  try {
    const decoded = jwt.verify(token, VOUCHER_JWT_PRIVATE_KEY, {
      algorithms: [VOUCHER_JWT_ALGORITHM as jwt.Algorithm],
    }) as any

    if (decoded.type !== 'voucher' || !decoded.vid) {
      return null
    }

    return { voucherId: decoded.vid }
  } catch (error) {
    logger.debug('Failed to decode QR token', { error: error.message })

    return null
  }
}
