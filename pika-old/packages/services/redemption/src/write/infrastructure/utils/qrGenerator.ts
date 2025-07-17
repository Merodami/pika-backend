import { ErrorFactory, logger } from '@pika/shared'
import * as QRCode from 'qrcode'

export interface QRGeneratorOptions {
  width?: number
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * QR Code generator for redemption tokens
 */
export class QRGenerator {
  private readonly defaultOptions: QRGeneratorOptions = {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  }

  /**
   * Generate QR code as base64 PNG string
   */
  async generateQRCode(
    token: string,
    options?: QRGeneratorOptions,
  ): Promise<string> {
    try {
      const qrOptions = { ...this.defaultOptions, ...options }

      const dataUrl = await QRCode.toDataURL(token, {
        width: qrOptions.width,
        margin: qrOptions.margin,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        color: qrOptions.color,
      })

      logger.debug('Generated QR code', { tokenLength: token.length })

      return dataUrl
    } catch (error) {
      logger.error('Error generating QR code', { error })
      throw ErrorFactory.fromError(error, 'Failed to generate QR code', {
        source: 'QRGenerator.generateQRCode',
      })
    }
  }

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSVG(
    token: string,
    options?: QRGeneratorOptions,
  ): Promise<string> {
    try {
      const qrOptions = { ...this.defaultOptions, ...options }

      const svgString = await QRCode.toString(token, {
        type: 'svg',
        width: qrOptions.width,
        margin: qrOptions.margin,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        color: qrOptions.color,
      })

      logger.debug('Generated QR code SVG', { tokenLength: token.length })

      return svgString
    } catch (error) {
      logger.error('Error generating QR code SVG', { error })
      throw ErrorFactory.fromError(error, 'Failed to generate QR code SVG', {
        source: 'QRGenerator.generateQRCodeSVG',
      })
    }
  }

  /**
   * Generate QR code as Buffer (for file storage)
   */
  async generateQRCodeBuffer(
    token: string,
    options?: QRGeneratorOptions,
  ): Promise<Buffer> {
    try {
      const qrOptions = { ...this.defaultOptions, ...options }

      const buffer = await QRCode.toBuffer(token, {
        width: qrOptions.width,
        margin: qrOptions.margin,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        color: qrOptions.color,
      })

      logger.debug('Generated QR code buffer', {
        tokenLength: token.length,
        bufferSize: buffer.length,
      })

      return buffer
    } catch (error) {
      logger.error('Error generating QR code buffer', { error })
      throw ErrorFactory.fromError(error, 'Failed to generate QR code buffer', {
        source: 'QRGenerator.generateQRCodeBuffer',
      })
    }
  }

  /**
   * Generate QR code with embedded logo
   */
  async generateQRCodeWithLogo(
    token: string,
    logoUrl: string,
    options?: QRGeneratorOptions,
  ): Promise<string> {
    try {
      // First generate the base QR code with higher error correction
      const qrOptions = {
        ...this.defaultOptions,
        ...options,
        errorCorrectionLevel: 'H' as const, // High error correction for logo overlay
      }

      const dataUrl = await QRCode.toDataURL(token, {
        width: qrOptions.width,
        margin: qrOptions.margin,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        color: qrOptions.color,
      })

      // Note: Logo embedding would require additional image processing
      // This is a placeholder for future implementation
      logger.debug('Generated QR code for logo overlay', {
        tokenLength: token.length,
        logoUrl,
      })

      return dataUrl
    } catch (error) {
      logger.error('Error generating QR code with logo', { error, logoUrl })
      throw ErrorFactory.fromError(
        error,
        'Failed to generate QR code with logo',
        {
          source: 'QRGenerator.generateQRCodeWithLogo',
        },
      )
    }
  }
}
