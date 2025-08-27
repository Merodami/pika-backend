/**
 * RSA Key Preparation Utilities
 *
 * Handles various RSA key formats for JWT signing:
 * - Base64 encoded keys
 * - Single-line PEM format (from environment variables)
 * - Multi-line PEM format
 */

/**
 * Prepare RSA key for use with JWT libraries
 *
 * Handles multiple input formats:
 * 1. Base64 encoded PEM keys
 * 2. Single-line PEM format (no line breaks)
 * 3. Properly formatted multi-line PEM
 *
 * @param key - The key in any supported format
 * @param type - Whether this is a private or public key
 * @returns Properly formatted PEM key with line breaks
 */
export function prepareRSAKey(key: string, type: 'PRIVATE' | 'PUBLIC'): string {
  if (!key) return ''

  // Handle escaped newlines (from environment variables)
  let processedKey = key

  if (processedKey.includes('\\n') && !processedKey.includes('\n')) {
    processedKey = processedKey.replace(/\\n/g, '\n')
  }

  // Check if it's base64 encoded (no PEM headers and no actual newlines)
  if (!processedKey.includes('-----BEGIN') && !processedKey.includes('\n')) {
    try {
      // Attempt to decode from base64
      const decoded = Buffer.from(processedKey, 'base64').toString('utf-8')

      // If decoded has PEM headers, it was base64 encoded PEM
      if (decoded.includes('-----BEGIN')) {
        return decoded
      }
      // Otherwise treat original as PEM without line breaks
    } catch {
      // Not base64, treat as PEM that needs formatting
    }
  }

  // If already has proper PEM format with line breaks, return as is
  if (processedKey.includes('-----BEGIN') && processedKey.includes('\n')) {
    return processedKey
  }

  // Format single-line PEM key with proper line breaks
  return formatPEMKey(processedKey, type)
}

/**
 * Format a single-line PEM key with proper line breaks
 *
 * @param key - Single-line PEM key
 * @param type - Whether this is a private or public key
 * @returns Properly formatted multi-line PEM key
 */
function formatPEMKey(key: string, type: 'PRIVATE' | 'PUBLIC'): string {
  // Remove any existing header/footer and whitespace
  const cleanKey = key
    .replace(/-----BEGIN.*?-----/g, '')
    .replace(/-----END.*?-----/g, '')
    .replace(/\s/g, '')

  // Add line breaks every 64 characters (PEM standard)
  const formattedKey = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey

  // Add proper header and footer
  const header =
    type === 'PRIVATE'
      ? '-----BEGIN PRIVATE KEY-----'
      : '-----BEGIN PUBLIC KEY-----'
  const footer =
    type === 'PRIVATE'
      ? '-----END PRIVATE KEY-----'
      : '-----END PUBLIC KEY-----'

  return `${header}\n${formattedKey}\n${footer}`
}

/**
 * Check if a key is in base64 format
 *
 * @param key - The key to check
 * @returns True if the key appears to be base64 encoded
 */
export function isBase64EncodedKey(key: string): boolean {
  if (!key) return false

  // If it has PEM headers or newlines, it's not base64
  if (key.includes('-----BEGIN') || key.includes('\n')) {
    return false
  }

  // Check if it's valid base64
  try {
    const decoded = Buffer.from(key, 'base64').toString('utf-8')

    // Check if decoded content has PEM headers
    return decoded.includes('-----BEGIN')
  } catch {
    return false
  }
}

/**
 * Convert an RSA key to base64 format
 *
 * @param key - PEM formatted key (with or without line breaks)
 * @returns Base64 encoded key
 */
export function convertKeyToBase64(key: string): string {
  if (!key) return ''

  // If already base64, return as is
  if (isBase64EncodedKey(key)) {
    return key
  }

  // Convert PEM to base64
  return Buffer.from(key).toString('base64')
}
