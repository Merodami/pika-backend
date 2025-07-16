import {
  CreatePriceRequest,
  CreateProductRequest,
  ListPricesQuery,
  ListProductsQuery,
  PriceIdParam,
  ProductIdParam,
  UpdateProductRequest,
} from '@pika/api/public'
import { getValidatedQuery } from '@pika/http'
import { logger } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IProductService } from '../services/ProductService.js'

/**
 * Handles Stripe product and price management
 */
export class ProductController {
  constructor(private readonly productService: IProductService) {
    // Bind all methods to preserve 'this' context
    this.createProduct = this.createProduct.bind(this)
    this.updateProduct = this.updateProduct.bind(this)
    this.createPrice = this.createPrice.bind(this)
    this.deactivatePrice = this.deactivatePrice.bind(this)
    this.listProducts = this.listProducts.bind(this)
    this.listPrices = this.listPrices.bind(this)
  }

  /**
   * POST /products
   * Create a new Stripe product
   */
  async createProduct(
    request: Request<{}, {}, CreateProductRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, description, metadata } = request.body

      logger.info('Creating product via API', { name })

      const product = await this.productService.createProduct({
        name,
        description,
        metadata,
      })

      response.status(201).json(product)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /products/:id
   * Update Stripe product
   */
  async updateProduct(
    request: Request<ProductIdParam, {}, UpdateProductRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const { name, description, active, metadata } = request.body

      logger.info('Updating product via API', { id })

      const product = await this.productService.updateProduct(id, {
        name,
        description,
        active,
        metadata,
      })

      response.json(product)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /prices
   * Create a new price for a product
   */
  async createPrice(
    request: Request<{}, {}, CreatePriceRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productId, amount, currency, interval, intervalCount } =
        request.body

      logger.info('Creating price via API', { productId, amount })

      const price = await this.productService.createPrice({
        productId,
        amount,
        currency,
        interval,
        intervalCount,
      })

      response.status(201).json(price)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /prices/:id/deactivate
   * Deactivate a price
   */
  async deactivatePrice(
    request: Request<PriceIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Deactivating price via API', { id })

      const price = await this.productService.deactivatePrice(id)

      response.json(price)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /products
   * List all products
   */
  async listProducts(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<ListProductsQuery>(request)
      const { limit } = query

      logger.info('Listing products via API', { limit })

      const products = await this.productService.listProducts(limit)

      response.json({ data: products })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /prices
   * List prices with optional product filter
   */
  async listPrices(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<ListPricesQuery>(request)
      const { productId, limit } = query

      logger.info('Listing prices via API', { productId, limit })

      const prices = await this.productService.listPrices(productId, limit)

      response.json({ data: prices })
    } catch (error) {
      next(error)
    }
  }
}
