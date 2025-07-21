/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Upload user avatar/profile picture
 */
export type UploadAvatarRequest = {
  /**
   * Base64 encoded image data or file upload
   */
  avatar: string
  /**
   * Image format
   */
  format?: 'JPEG' | 'PNG' | 'WEBP'
}
