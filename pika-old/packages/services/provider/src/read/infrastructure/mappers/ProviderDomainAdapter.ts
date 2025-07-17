import { ProviderMapper } from '@pika/sdk'
import { Provider } from '@provider-read/domain/entities/Provider.js'

/**
 * Adapter to bridge between local Provider domain entity and SDK's ProviderDomain
 *
 * WHY THIS EXISTS:
 * Our domain entity uses MultilingualText where 'es' and 'gn' are optional (string | undefined)
 * to match the actual database schema and business reality (not all content is translated).
 * However, the SDK's ProviderDomain expects MultilingualContent where all fields are required.
 *
 * This adapter ensures compatibility while maintaining our domain model integrity.
 * Following the same pattern as CategoryDomainAdapter in Admin/Category services.
 */
export class ProviderDomainAdapter {
  /**
   * Convert our local Provider entity to SDK's ProviderDomain format
   * Ensures all multilingual fields have values (empty strings for missing translations)
   */
  static toSdkDomain(provider: Provider): any {
    const data = provider.toObject()

    return {
      id: data.id,
      userId: data.userId,
      businessName: {
        en: data.businessName.en,
        es: data.businessName.es || '', // Convert undefined to empty string
        gn: data.businessName.gn || '', // Convert undefined to empty string
      },
      businessDescription: {
        en: data.businessDescription.en,
        es: data.businessDescription.es || '', // Convert undefined to empty string
        gn: data.businessDescription.gn || '', // Convert undefined to empty string
      },
      categoryId: data.categoryId,
      verified: data.verified,
      active: data.active,
      avgRating: data.avgRating,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      deletedAt: data.deletedAt,
      user: data.user,
    }
  }

  /**
   * Convert our Provider entity to API DTO using SDK mapper
   * This method chains our adapter with SDK's mapper for proper DTO conversion
   */
  static toDTO(provider: Provider): any {
    const sdkDomain = this.toSdkDomain(provider)

    return ProviderMapper.toDTO(sdkDomain)
  }
}
