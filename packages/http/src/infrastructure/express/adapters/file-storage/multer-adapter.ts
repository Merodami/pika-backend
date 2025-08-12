import { ErrorFactory, FileUpload } from '@pika/shared'
import {
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  isValidFileExtension,
} from '@pika/types'
import multer from 'multer'
import { Readable } from 'stream'

/**
 * Adapter to convert Express/Multer file to our framework-agnostic FileUpload
 */
export function adaptMulterFile(file: Express.Multer.File): FileUpload {
  // Convert buffer to stream
  const stream = new Readable()

  stream.push(file.buffer)
  stream.push(null)

  return {
    file: stream,
    filename: file.originalname || 'unknown',
    mimetype: file.mimetype,
    size: file.size,
    fieldname: file.fieldname,
    encoding: file.encoding,
  }
}

/**
 * Create multer middleware with default settings
 */
export function createMulterMiddleware(options?: multer.Options) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: FILE_SIZE_LIMITS.DEFAULT,
    },
    ...options,
  })
}

/**
 * Create multer middleware for avatar uploads
 */
export function createAvatarUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: FILE_SIZE_LIMITS.AVATAR,
    },
    fileFilter: (req, file, cb) => {
      // Validate MIME type
      if (!ALLOWED_FILE_TYPES.AVATAR.includes(file.mimetype as any)) {
        const error = ErrorFactory.validationError({
          [file.fieldname]: [
            `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.AVATAR.join(', ')}`,
          ],
        })

        return cb(error as any, false)
      }

      // Validate file extension matches MIME type
      if (!isValidFileExtension(file.originalname, file.mimetype)) {
        const error = ErrorFactory.validationError({
          [file.fieldname]: [`File extension doesn't match MIME type`],
        })

        return cb(error as any, false)
      }

      cb(null, true)
    },
  })
}

/**
 * Validate an uploaded avatar file
 */
export function validateAvatarFile(file: Express.Multer.File): void {
  if (!file) {
    throw ErrorFactory.badRequest('No file uploaded')
  }

  // Validate field name
  if (file.fieldname !== 'avatar') {
    throw ErrorFactory.validationError({
      [file.fieldname]: [
        `Expected field name 'avatar', got '${file.fieldname}'`,
      ],
    })
  }

  // Validate MIME type
  if (!ALLOWED_FILE_TYPES.AVATAR.includes(file.mimetype as any)) {
    throw ErrorFactory.validationError({
      [file.fieldname]: [
        `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.AVATAR.join(', ')}`,
      ],
    })
  }

  // Validate file size
  if (file.size > FILE_SIZE_LIMITS.AVATAR) {
    throw ErrorFactory.validationError({
      [file.fieldname]: [
        `File too large. Maximum size: ${FILE_SIZE_LIMITS.AVATAR} bytes`,
      ],
    })
  }

  // Validate extension
  if (!isValidFileExtension(file.originalname, file.mimetype)) {
    throw ErrorFactory.validationError({
      [file.fieldname]: [`File extension doesn't match MIME type`],
    })
  }
}
