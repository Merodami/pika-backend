import { Category } from '@category-read/domain/entities/Category.js'
import { CategoryDomain } from '@pika/sdk'
import { type MultilingualContent } from '@pika/types-core'

/**
 * Adapter to convert between our domain entity and SDK's CategoryDomain
 *
 * WHY THIS EXISTS:
 * Our domain entity uses MultilingualText where 'es' and 'gn' are optional (string | undefined)
 * to match the actual database schema and business reality (not all content is translated).
 * However, the SDK's CategoryDomain expects MultilingualContent where all fields are required.
 *
 * This adapter bridges that gap by ensuring empty strings for missing translations,
 * allowing us to use the SDK's CategoryMapper.toDTO for consistent API responses.
 *
 * This is a conscious architectural decision to keep our domain model true to business
 * reality while maintaining API compatibility.
 */
export class CategoryDomainAdapter {
  /**
   * Convert our domain entity to SDK's CategoryDomain format
   */
  static toSdkDomain(category: Category): CategoryDomain {
    const obj = category.toObject()

    return {
      id: obj.id,
      name: {
        en: obj.name.en,
        es: obj.name.es || '',
        gn: obj.name.gn || '',
      } as MultilingualContent,
      description: {
        en: obj.description.en,
        es: obj.description.es || '',
        gn: obj.description.gn || '',
      } as MultilingualContent,
      iconUrl: obj.iconUrl,
      slug: obj.slug,
      parentId: obj.parentId,
      level: obj.level,
      path: obj.path,
      active: obj.active,
      sortOrder: obj.sortOrder,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      children: obj.children?.map((child: any) => {
        // If child is already a Category instance
        if (child instanceof Category) {
          return CategoryDomainAdapter.toSdkDomain(child)
        }

        // Otherwise it's already in the right format
        return child
      }),
    }
  }
}
