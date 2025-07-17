import { MultipartFile } from '@fastify/multipart'
import { FileUpload } from '@pika/shared'

/**
 * Adapter to convert Fastify's MultipartFile to our framework-agnostic FileUpload
 */
export function adaptFastifyMultipart(file: MultipartFile): FileUpload {
  return {
    file: file.file,
    filename: file.filename || 'unknown',
    mimetype: file.mimetype,
    size: file.file.bytesRead, // Access size from the stream
    fieldname: file.fieldname,
    encoding: file.encoding,
  }
}
