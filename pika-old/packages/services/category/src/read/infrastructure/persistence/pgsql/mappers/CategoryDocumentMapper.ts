import { Category } from '@category-read/domain/entities/Category.js'
import { MultilingualText } from '@pika/types-core'

/**
 * Database document interface matching Prisma schema
 * Following Admin Service pattern for document mapping
 */
export interface CategoryDocument {
  id: string
  name: any // JSON field from Prisma
  description: any // JSON field from Prisma
  iconUrl: string | null
  slug: string
  parentId: string | null
  level: number
  path: string
  active: boolean
  sortOrder: number
  createdAt: Date | null
  updatedAt: Date | null
  children?: CategoryDocument[]
}

/**
 * CategoryDocumentMapper handles conversion between database documents and domain entities
 * Following Admin Service gold standard pattern - NO external dependencies
 */
export class CategoryDocumentMapper {
  /**
   * Ensure multilingual text has proper structure
   * Following Admin pattern exactly
   */
  static ensureMultilingualText(value: any): MultilingualText {
    if (!value || typeof value !== 'object') {
      return { en: '', es: '', gn: '' }
    }

    return {
      en: String(value.en || ''),
      es: String(value.es || ''),
      gn: String(value.gn || ''),
    }
  }

  /**
   * Map database document to domain entity
   * Following Admin Service pattern for clean separation
   */
  static mapDocumentToDomain(document: CategoryDocument | any): Category {
    // Handle both camelCase (from Prisma) and snake_case formats
    return new Category({
      id: document.id,
      name: this.ensureMultilingualText(document.name),
      description: this.ensureMultilingualText(document.description),
      iconUrl: document.iconUrl ?? document.icon_url ?? null,
      slug: document.slug,
      parentId: document.parentId ?? document.parent_id ?? null,
      level: document.level,
      path: document.path,
      active: document.active,
      sortOrder: document.sortOrder ?? document.sort_order ?? 0,
      createdAt: document.createdAt ?? document.created_at ?? null,
      updatedAt: document.updatedAt ?? document.updated_at ?? null,
      children: document.children?.map((child: any) =>
        this.mapDocumentToDomain(child),
      ),
    })
  }

  /**
   * Map domain entity to database document format
   * For write operations
   */
  static mapDomainToDocument(category: Category): Partial<CategoryDocument> {
    const obj = category.toObject()

    return {
      id: obj.id,
      name: obj.name,
      description: obj.description,
      iconUrl: obj.iconUrl,
      slug: obj.slug,
      parentId: obj.parentId,
      level: obj.level,
      path: obj.path,
      active: obj.active,
      sortOrder: obj.sortOrder,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }
  }

  /**
   * Map multiple documents to domain entities
   * Convenience method for list operations
   */
  static mapDocumentsToDomain(documents: CategoryDocument[]): Category[] {
    return documents.map((doc) => this.mapDocumentToDomain(doc))
  }
}
