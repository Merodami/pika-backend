import type { PrismaClient } from '@prisma/client'
import {
  BatchFileUploadRequest,
  FileHistoryIdParam,
  FileIdParam,
  FileUploadRequest,
  GetFileHistoryQuery,
  GetFileUrlQuery,
} from '@pika/api/public'
import {
  allowServiceOrUserAuth,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika
import type { ICacheService } from '@pika'
import { ErrorFactory } from '@pikad'
import { NextFunction, Request, Response, Router } from 'express'
import multer from 'multer'

import { FileController } from '../controllers/FileController.js'
import { FileStorageLogRepository } from '../repositories/FileStorageLogRepository.js'
import {
  type StorageConfig,
  StorageService,
} from '../services/StorageService.js'

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// Multer error handler middleware
function handleMulterError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const error = ErrorFactory.badRequest('File size exceeds limit of 10MB', {
        httpStatus: 413,
        source: 'multer',
        metadata: { code: err.code },
      })

      return next(error)
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      const error = ErrorFactory.badRequest('Too many files uploaded', {
        httpStatus: 413,
        source: 'multer',
        metadata: { code: err.code },
      })

      return next(error)
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      const error = ErrorFactory.badRequest(`Unexpected field: ${err.field}`)

      return next(error)
    }
  }
  next(err)
}

export function createFileRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  storageConfig: StorageConfig,
): Router {
  const router = Router()

  // Initialize repositories
  const fileStorageLogRepository = new FileStorageLogRepository(prisma, cache)

  // Initialize service
  const storageService = new StorageService(
    fileStorageLogRepository,
    cache,
    storageConfig,
  )

  // Initialize controller
  const controller = new FileController(storageService)

  // File routes
  router.post(
    '/upload',
    allowServiceOrUserAuth(),
    upload.single('file'),
    handleMulterError,
    validateBody(FileUploadRequest),
    controller.uploadFile,
  )

  router.post(
    '/upload-batch',
    allowServiceOrUserAuth(),
    upload.array('files', 10), // Maximum 10 files
    handleMulterError,
    validateBody(BatchFileUploadRequest),
    controller.uploadBatch,
  )

  router.delete(
    '/:fileId',
    requireAuth(),
    validateParams(FileIdParam),
    controller.deleteFile,
  )

  router.get(
    '/:fileId/url',
    requireAuth(),
    validateParams(FileIdParam),
    validateQuery(GetFileUrlQuery),
    controller.getFileUrl,
  )

  router.get(
    '/history',
    requireAuth(),
    validateQuery(GetFileHistoryQuery),
    controller.getFileHistory,
  )

  router.get(
    '/history/:id',
    requireAuth(),
    validateParams(FileHistoryIdParam),
    controller.getFileById,
  )

  return router
}
