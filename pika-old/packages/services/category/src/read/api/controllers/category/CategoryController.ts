import { adaptCategorySearchQuery } from '@category-read/application/adapters/sortingAdapter.js'
import {
  GetAllCategoriesHandler,
  GetCategoryByIdHandler,
} from '@category-read/application/use_cases/queries/index.js'
import { CategoryDomainAdapter } from '@category-read/infrastructure/mappers/CategoryDomainAdapter.js'
import { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getPreferredLanguage } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { categoryLocalizationConfig, CategoryMapper } from '@pika/sdk'
import { ErrorFactory, processMultilingualContent } from '@pika/shared'
import type { FastifyRequest } from 'fastify'

// We'll use CategoryMapper.ensureMultilingualText instead of creating our own function

/**
 * Controller handling HTTP requests for category read operations
 * Implements proper caching for performance
 */
export class CategoryController {
  constructor(
    private readonly getAllCategoriesHandler: GetAllCategoriesHandler,
    private readonly getCategoryByIdHandler: GetCategoryByIdHandler,
  ) {
    this.getAllCategories = this.getAllCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
  }

  /**
   * GET /category
   * Get all categories with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'categories',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllCategories(
    request: FastifyRequest<{
      Querystring: schemas.CategorySearchQuery
    }>,
  ) {
    const query = request.query as schemas.CategorySearchQuery

    // Use the adapter to convert API query to domain model format
    // This properly handles type conversions for sort parameters
    const searchParams = adaptCategorySearchQuery(query)

    const result = await this.getAllCategoriesHandler.execute(searchParams)

    // Convert domain models to API DTOs with safe date conversion
    // Convert our domain entities to SDK format first, then to DTO
    const dtoResult = {
      data: result.data.map((category) =>
        CategoryMapper.toDTO(CategoryDomainAdapter.toSdkDomain(category)),
      ),
      pagination: result.pagination,
    }

    // Get the preferred language from the request.language property
    // This is set by the languageNegotiation plugin
    const preferredLanguage = getPreferredLanguage(request)

    // Use the reusable multilingual content processor
    // It handles both 'all' and specific language cases
    return processMultilingualContent(
      dtoResult,
      {
        multilingualFields: [],
        recursiveFields: [
          {
            field: 'data',
            config: categoryLocalizationConfig,
          },
        ],
      },
      preferredLanguage,
    )
  }

  /**
   * GET /category/:categoryId
   * Get a specific category by ID
   */
  @Cache({
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
    prefix: 'categories',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryById(
    request: FastifyRequest<{
      Params: schemas.CategoryId
      Querystring: {
        include_children?: boolean
      }
    }>,
  ) {
    const { category_id } = request.params
    const { include_children } = request.query

    const category = await this.getCategoryByIdHandler.execute({
      id: category_id,
      includeChildren:
        include_children === undefined ? undefined : Boolean(include_children),
    })

    if (!category) {
      throw ErrorFactory.resourceNotFound('Category', category_id, {
        correlationId: request.id,
        source: 'CategoryController.getCategoryById',
        suggestion:
          'Check that the category ID exists and is in the correct format',
        metadata: {
          requestParams: request.params,
          includeChildren: include_children,
        },
      })
    }

    // Convert to API DTO
    // Convert our domain entity to SDK format first, then to DTO
    const dto = CategoryMapper.toDTO(
      CategoryDomainAdapter.toSdkDomain(category),
    )

    // Get the preferred language from the Accept-Language header via request.language
    const preferredLanguage = getPreferredLanguage(request)

    // Use our reusable multilingual processor for consistent handling
    return processMultilingualContent(
      dto,
      categoryLocalizationConfig,
      preferredLanguage,
    )
  }
}
