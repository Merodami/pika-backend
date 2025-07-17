import { VoucherBook } from '@pdf-write/domain/entities/VoucherBook.js'
import { PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { CryptoServiceAdapter } from '@pdf-write/infrastructure/services/CryptoServiceAdapter.js'
import {
  AdPlacementInfo,
  PageLayout,
  PageLayoutEngine,
} from '@pdf-write/infrastructure/services/PageLayoutEngine.js'
import {
  GeneratePDFOptions,
  PDFGenerationService,
  VoucherData,
} from '@pdf-write/infrastructure/services/PDFGenerationService.js'
import { PDFGenerationRateLimiter } from '@pdf-write/infrastructure/services/PDFRateLimiter.js'
import { VoucherServiceClient } from '@pdf-write/infrastructure/services/VoucherServiceClient.js'
import { RequestContext, type UserContext } from '@pika/http'
import {
  ErrorFactory,
  FileStoragePort,
  logger,
  NotAuthorizedError,
  ProviderServiceClient,
} from '@pika/shared'
import { VoucherBookStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

export interface GeneratePDFCommand {
  bookId: string
  userId: string
}

export interface GeneratePDFResult {
  success: boolean
  pdfUrl?: string
  generatedAt?: Date
  error?: string
}

export class GeneratePDFCommandHandler {
  constructor(
    private readonly repository: PDFWriteRepositoryPort,
    private readonly fileStorage: FileStoragePort,
    private readonly pdfGenerationService: PDFGenerationService,
    private readonly pageLayoutEngine: PageLayoutEngine,
    private readonly voucherServiceClient: VoucherServiceClient,
    private readonly cryptoServiceAdapter: CryptoServiceAdapter,
    private readonly providerServiceClient: ProviderServiceClient,
    private readonly rateLimiter: PDFGenerationRateLimiter,
  ) {}

  async execute(
    command: GeneratePDFCommand,
    context: UserContext,
  ): Promise<GeneratePDFResult> {
    const { bookId, userId } = command

    logger.info('Starting PDF generation', {
      bookId,
      userId,
      role: context.role,
    })

    try {
      // 0. Check rate limits
      const rateLimitResult = await this.rateLimiter.checkRateLimit(userId)

      if (!rateLimitResult.allowed) {
        logger.warn('PDF generation rate limit exceeded', {
          userId,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        })

        return {
          success: false,
          error: `Rate limit exceeded. Try again after ${rateLimitResult.retryAfter} seconds.`,
        }
      }

      // 1. Fetch voucher book with pages and placements
      const bookData = await this.repository.getVoucherBookWithPages(bookId)

      if (!bookData) {
        throw ErrorFactory.resourceNotFound('VoucherBook', bookId, {
          source: 'GeneratePDFCommandHandler.execute',
        })
      }

      // Check authorization - only book creator or admin can generate PDF
      if (!RequestContext.isAdmin(context)) {
        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to generate PDF for this voucher book',
            {
              metadata: {
                userId: context.userId,
                bookId: bookId,
                createdBy: bookData.createdBy,
                providerId: bookData.providerId,
              },
            },
          )
        }
      }

      // Reconstitute domain entity
      const voucherBook = VoucherBook.reconstitute({
        id: bookData.id,
        title: bookData.title,
        edition: bookData.edition,
        bookType: bookData.bookType,
        month: bookData.month,
        year: bookData.year,
        status: bookData.status,
        totalPages: bookData.totalPages,
        coverImageUrl: bookData.coverImageUrl,
        backImageUrl: bookData.backImageUrl,
        pdfUrl: bookData.pdfUrl,
        generatedAt: bookData.pdfGeneratedAt
          ? new Date(bookData.pdfGeneratedAt)
          : null,
        publishedAt: bookData.publishedAt
          ? new Date(bookData.publishedAt)
          : null,
        createdBy: bookData.createdBy,
        providerId: bookData.providerId,
        createdAt: bookData.createdAt ? new Date(bookData.createdAt) : null,
        updatedAt: bookData.updatedAt ? new Date(bookData.updatedAt) : null,
      })

      // Check if book can be generated
      if (!voucherBook.isDraft() && !voucherBook.isReadyForPrint()) {
        return {
          success: false,
          error: 'Only draft or ready-for-print books can be generated',
        }
      }

      // 2. Collect all voucher IDs from placements
      const voucherIds = new Set<string>()

      for (const page of bookData.pages || []) {
        for (const placement of page.adPlacements || []) {
          if (placement.contentType === 'VOUCHER' && placement.voucherId) {
            voucherIds.add(placement.voucherId)
          }
        }
      }

      if (voucherIds.size === 0) {
        logger.warn('No vouchers found in book', { bookId })

        return {
          success: false,
          error:
            'No vouchers found in book. Add vouchers to pages before generating PDF.',
        }
      }

      // 3. Fetch voucher data
      const vouchers = await this.fetchVoucherData(Array.from(voucherIds))

      // Validate all vouchers were found
      const missingVouchers = Array.from(voucherIds).filter(
        (id) => !vouchers.has(id),
      )

      if (missingVouchers.length > 0) {
        logger.error('Missing vouchers for PDF generation', {
          bookId,
          missingVouchers,
        })

        return {
          success: false,
          error: `Failed to fetch vouchers: ${missingVouchers.join(', ')}`,
        }
      }

      // 4. Generate QR payloads for all vouchers
      const qrPayloads = await this.generateQRPayloads(
        Array.from(voucherIds),
        vouchers,
        bookId,
      )

      // 5. Build page layouts
      const pageLayouts = this.buildPageLayouts(bookData.pages || [])

      // 6. Generate PDF
      const pdfOptions: GeneratePDFOptions = {
        bookId: voucherBook.id,
        title: voucherBook.title,
        month: voucherBook.month || new Date().getMonth() + 1,
        year: voucherBook.year,
        pages: pageLayouts,
        vouchers,
        qrPayloads,
      }

      const pdfBuffer =
        await this.pdfGenerationService.generateVoucherBookPDF(pdfOptions)

      // 7. Upload PDF to storage
      const fileName = `voucher-books/${bookId}/${randomUUID()}.pdf`
      const uploadResult = await this.fileStorage.saveFile(
        {
          buffer: pdfBuffer,
          filename: fileName,
          mimetype: 'application/pdf',
        } as any,
        'voucher-books',
      )

      // 8. Update voucher book status and PDF URL
      const generatedAt = new Date()
      const newStatus = voucherBook.isDraft()
        ? VoucherBookStatus.READY_FOR_PRINT
        : voucherBook.status

      await this.repository.updateVoucherBookStatus(bookId, {
        status: newStatus,
        pdfUrl: uploadResult.url,
      })

      logger.info('PDF generation completed', {
        bookId,
        pdfUrl: uploadResult.url,
        fileSize: pdfBuffer.length,
      })

      return {
        success: true,
        pdfUrl: uploadResult.url,
        generatedAt,
      }
    } catch (error) {
      logger.error('PDF generation failed', {
        bookId,
        error,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      }
    }
  }

  /**
   * Fetch voucher data from voucher service with batch provider fetching
   */
  private async fetchVoucherData(
    voucherIds: string[],
  ): Promise<Map<string, VoucherData>> {
    const voucherMap = new Map<string, VoucherData>()

    if (voucherIds.length === 0) {
      return voucherMap
    }

    try {
      const vouchersResponse =
        await this.voucherServiceClient.getVouchersByIds(voucherIds)

      // Collect unique provider IDs
      const providerIds = new Set<string>()

      for (const [_, voucher] of vouchersResponse) {
        if (voucher.provider_id) {
          providerIds.add(voucher.provider_id)
        }
      }

      // Batch fetch all providers
      const providerNames = await this.batchFetchProviders(
        Array.from(providerIds),
      )

      // Build voucher data map
      for (const [id, voucher] of vouchersResponse) {
        const businessName =
          providerNames.get(voucher.provider_id) || 'Unknown Business'

        voucherMap.set(id, {
          id: voucher.id,
          title: voucher.title?.en || voucher.title?.es || '',
          description: voucher.description?.en || voucher.description?.es || '',
          discount: `${voucher.discount_value}${voucher.discount_type === 'PERCENTAGE' ? '%' : ' Gs'} OFF`,
          businessName,
          termsAndConditions:
            voucher.terms_and_conditions?.en ||
            voucher.terms_and_conditions?.es,
          expiresAt: new Date(voucher.expires_at),
        })
      }

      return voucherMap
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to fetch voucher data', {
        source: 'GeneratePDFCommandHandler.fetchVoucherData',
        metadata: { voucherCount: voucherIds.length },
      })
    }
  }

  /**
   * Batch fetch providers for better performance
   */
  private async batchFetchProviders(
    providerIds: string[],
  ): Promise<Map<string, string>> {
    const providerNames = new Map<string, string>()

    if (providerIds.length === 0) {
      return providerNames
    }

    try {
      // Use Promise.allSettled to fetch all providers concurrently
      // This ensures we don't fail the entire batch if some providers fail
      const results = await Promise.allSettled(
        providerIds.map(async (providerId) => {
          const provider =
            await this.providerServiceClient.getProvider(providerId)

          return { providerId, provider }
        }),
      )

      // Process results and handle failures gracefully
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { providerId, provider } = result.value

          if (provider && provider.businessName) {
            // Use English name as default, fallback to Spanish
            const businessName =
              provider.businessName.en ||
              provider.businessName.es ||
              'Unknown Business'

            providerNames.set(providerId, businessName)
          } else {
            providerNames.set(providerId, 'Unknown Business')
          }
        } else {
          // Extract provider ID from the error context if possible
          logger.warn('Failed to fetch provider in batch', {
            error: result.reason,
          })
        }
      }

      // Ensure all provider IDs have names (fallback for failed fetches)
      for (const providerId of providerIds) {
        if (!providerNames.has(providerId)) {
          providerNames.set(providerId, 'Unknown Business')
        }
      }

      return providerNames
    } catch (error) {
      logger.error('Batch provider fetch failed', { error, providerIds })

      // Fallback: set all providers to unknown
      for (const providerId of providerIds) {
        providerNames.set(providerId, 'Unknown Business')
      }

      return providerNames
    }
  }

  /**
   * Generate QR payloads for all vouchers
   */
  private async generateQRPayloads(
    voucherIds: string[],
    vouchers: Map<string, VoucherData>,
    batchId: string,
  ): Promise<Map<string, string>> {
    // We need to fetch the raw voucher data again to get provider IDs
    // This is because VoucherData doesn't include provider ID
    const vouchersResponse =
      await this.voucherServiceClient.getVouchersByIds(voucherIds)

    const payloadRequests = voucherIds
      .filter((id) => vouchers.has(id))
      .map(async (voucherId) => {
        const shortCodeResult =
          await this.cryptoServiceAdapter.generateShortCode(voucherId, {
            type: 'print',
            expirationDays: 365, // 1 year for printed vouchers
          })
        const voucherData = vouchersResponse.get(voucherId)

        return {
          voucherId,
          providerId: voucherData?.provider_id || 'unknown',
          shortCode: shortCodeResult.shortCode,
        }
      })

    const voucherDataArray = await Promise.all(payloadRequests)

    return await this.cryptoServiceAdapter.generateBatchQRPayloads(
      voucherDataArray,
      batchId,
    )
  }

  /**
   * Build page layouts from database data
   */
  private buildPageLayouts(pages: any[]): PageLayout[] {
    const layouts: PageLayout[] = []

    for (const page of pages) {
      const pageLayout = this.pageLayoutEngine.createEmptyPage(page.pageNumber)

      // Sort placements by position to ensure proper layout
      const sortedPlacements = (page.adPlacements || []).sort(
        (a: any, b: any) => a.position - b.position,
      )

      for (const placement of sortedPlacements) {
        const adInfo: AdPlacementInfo = {
          id: placement.id,
          position: placement.position,
          size: placement.size,
          spacesUsed: placement.spacesUsed,
          contentType: placement.contentType,
          voucherId: placement.voucherId,
          imageUrl: placement.imageUrl,
          designUrl: placement.designUrl,
          shortCode: placement.shortCode,
          title: placement.title,
          description: placement.description,
        }

        // Mark spaces as occupied
        for (let i = 0; i < placement.spacesUsed; i++) {
          pageLayout.occupiedSpaces.add(placement.position + i)
        }

        pageLayout.placements.push(adInfo)
      }

      // Update available spaces
      pageLayout.availableSpaces = pageLayout.availableSpaces.filter(
        (space) => !pageLayout.occupiedSpaces.has(space),
      )

      layouts.push(pageLayout)
    }

    return layouts
  }
}
