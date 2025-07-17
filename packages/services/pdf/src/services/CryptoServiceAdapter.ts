// TODO: Migrate crypto package from pika-old
// Temporary implementation until crypto services are migrated

import { JWT_ISSUER, JWT_SECRET } from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'

export interface GenerateQRPayloadOptions {
  voucherId: string
  providerId: string
  shortCode: string
  batchId?: string
  ttl?: number
}

// Temporary mock implementations until crypto package is migrated
class MockVoucherQRService {
  async generatePrintVoucherQR(
    voucherId: string,
    batchId: string,
    privateKey: string,
    options: { ttl?: number },
  ) {
    // Mock implementation
    return {
      qrPayload: `mock-qr-${voucherId}-${batchId}`,
    }
  }
}

class MockShortCodeService {
  async generateShortCode(
    voucherId: string,
    options?: {
      type?: 'user' | 'print'
      batchCode?: string
      expirationDays?: number
    },
  ) {
    // Mock implementation
    return {
      shortCode: `MOCK${voucherId.slice(0, 4).toUpperCase()}`,
      checksum: 'mock-checksum',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {},
    }
  }
}

class MockECDSAService {
  async generateKeyPair() {
    return {
      privateKey: 'mock-private-key',
      publicKey: 'mock-public-key',
    }
  }
}

export class CryptoServiceAdapter {
  private voucherQRService: MockVoucherQRService
  private shortCodeService: MockShortCodeService
  private ecdsaService: MockECDSAService
  private keyPair: { privateKey: string; publicKey: string } | null = null

  constructor() {
    if (!JWT_ISSUER) {
      throw new Error(
        'JWT_ISSUER environment variable is required for PDF generation service',
      )
    }

    if (!JWT_SECRET) {
      throw new Error(
        'JWT_SECRET environment variable is required for PDF generation service',
      )
    }

    // Use mock services until crypto package is migrated
    this.voucherQRService = new MockVoucherQRService()
    this.shortCodeService = new MockShortCodeService()
    this.ecdsaService = new MockECDSAService()
  }

  /**
   * Initialize ECDSA key pair for PDF generation
   */
  async initialize(): Promise<void> {
    if (!this.keyPair) {
      this.keyPair = await this.ecdsaService.generateKeyPair()
      logger.info('Generated ECDSA key pair for PDF generation')
    }
  }

  /**
   * Get the private key, generating it if necessary
   */
  private async getPrivateKey(): Promise<string> {
    await this.initialize()

    return this.keyPair!.privateKey
  }

  /**
   * Generate QR payload for a voucher
   */
  async generateQRPayload(options: GenerateQRPayloadOptions): Promise<string> {
    try {
      const privateKey = await this.getPrivateKey()

      // Use print voucher QR generation for PDF voucher books
      const payload = await this.voucherQRService.generatePrintVoucherQR(
        options.voucherId,
        options.batchId || `batch-${Date.now()}`, // Use batchId or generate one
        privateKey,
        { ttl: options.ttl || 31536000 }, // 1 year default for printed vouchers
      )

      logger.debug('Generated QR payload', {
        voucherId: options.voucherId,
        providerId: options.providerId,
        shortCode: options.shortCode,
      })

      return payload.qrPayload
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to generate QR payload', {
        source: 'CryptoServiceAdapter.generateQRPayload',
      })
    }
  }

  /**
   * Generate QR payloads for multiple vouchers in batch
   */
  async generateBatchQRPayloads(
    vouchers: Array<{
      voucherId: string
      providerId: string
      shortCode: string
    }>,
    batchId: string,
  ): Promise<Map<string, string>> {
    const payloads = new Map<string, string>()

    try {
      // Generate payloads in parallel for better performance
      const promises = vouchers.map(async (voucher) => {
        const payload = await this.generateQRPayload({
          ...voucher,
          batchId,
        })

        return { voucherId: voucher.voucherId, payload }
      })

      const results = await Promise.all(promises)

      for (const result of results) {
        payloads.set(result.voucherId, result.payload)
      }

      logger.info('Generated batch QR payloads', {
        batchId,
        count: payloads.size,
      })

      return payloads
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to generate batch QR payloads',
        {
          source: 'CryptoServiceAdapter.generateBatchQRPayloads',
        },
      )
    }
  }

  /**
   * Generate a unique short code for a specific voucher
   */
  async generateShortCode(
    voucherId: string,
    options?: {
      type?: 'user' | 'print'
      batchCode?: string
      expirationDays?: number
    },
  ): Promise<{
    shortCode: string
    checksum?: string
    expiresAt?: Date
    metadata: any
  }> {
    try {
      return await this.shortCodeService.generateShortCode(voucherId, options)
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to generate short code', {
        source: 'CryptoServiceAdapter.generateShortCode',
      })
    }
  }
}