import {
  CreatePriceRequest,
  CreateProductRequest,
  ListPricesQuery,
  ListProductsQuery,
  PriceIdParam,
  ProductIdParam,
  UpdateProductRequest,
} from '@pika/api/public'
import {
  requireServiceAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import { Router } from 'express'

import { ProductController } from '../controllers/ProductController.js'
import type { IProductService } from '../services/ProductService.js'

export function createProductRouter(productService: IProductService): Router {
  const router = Router()
  const controller = new ProductController(productService)

  // All endpoints require service authentication (called by other services)

  // Product management
  router.post(
    '/products',
    requireServiceAuth(),
    validateBody(CreateProductRequest),
    controller.createProduct,
  )
  router.put(
    '/products/:id',
    requireServiceAuth(),
    validateParams(ProductIdParam),
    validateBody(UpdateProductRequest),
    controller.updateProduct,
  )
  router.get(
    '/products',
    requireServiceAuth(),
    validateQuery(ListProductsQuery),
    controller.listProducts,
  )

  // Price management
  router.post(
    '/prices',
    requireServiceAuth(),
    validateBody(CreatePriceRequest),
    controller.createPrice,
  )
  router.put(
    '/prices/:id/deactivate',
    requireServiceAuth(),
    validateParams(PriceIdParam),
    controller.deactivatePrice,
  )
  router.get(
    '/prices',
    requireServiceAuth(),
    validateQuery(ListPricesQuery),
    controller.listPrices,
  )

  return router
}
