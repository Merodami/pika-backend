import { p256 } from '@noble/curves/p256'
import { ErrorFactory, logger } from '@pika/shared'
import { randomBytes } from 'crypto'

/**
 * Generate a new ECDSA P-256 private key
 */
export async function generateECDSAKey(): Promise<string> {
  try {
    // Generate random 32 bytes for private key
    const privateKeyBytes = randomBytes(32)

    // Ensure the key is valid for P-256
    const privateKey = p256.utils.normPrivateKeyToScalar(privateKeyBytes)

    // Convert to hex string
    const privateKeyHex = privateKey.toString(16).padStart(64, '0')

    logger.info('Generated new ECDSA P-256 private key')

    return privateKeyHex
  } catch (error) {
    logger.error('Error generating ECDSA key', { error })
    throw ErrorFactory.fromError(error, 'Failed to generate ECDSA key', {
      source: 'cryptoUtils.generateECDSAKey',
    })
  }
}

/**
 * Derive public key from private key
 */
export async function derivePublicKey(privateKeyHex: string): Promise<string> {
  try {
    // Convert hex to bigint
    const privateKey = BigInt('0x' + privateKeyHex)

    // Get public key point
    const publicKeyPoint = p256.ProjectivePoint.BASE.multiply(privateKey)

    // Convert to uncompressed format (04 + x + y)
    const publicKeyHex = publicKeyPoint.toHex(false)

    logger.debug('Derived public key from private key')

    return publicKeyHex
  } catch (error) {
    logger.error('Error deriving public key', { error })
    throw ErrorFactory.fromError(error, 'Failed to derive public key', {
      source: 'cryptoUtils.derivePublicKey',
    })
  }
}

/**
 * Convert hex key to PEM format for JWT library
 */
export function hexToPEM(keyHex: string, type: 'private' | 'public'): string {
  try {
    // This is a simplified conversion - in production, use proper ASN.1 encoding
    const header =
      type === 'private'
        ? '-----BEGIN EC PRIVATE KEY-----'
        : '-----BEGIN PUBLIC KEY-----'
    const footer =
      type === 'private'
        ? '-----END EC PRIVATE KEY-----'
        : '-----END PUBLIC KEY-----'

    // Convert hex to base64 (simplified - proper implementation needs ASN.1)
    const keyBuffer = Buffer.from(keyHex, 'hex')
    const base64Key = keyBuffer.toString('base64')

    // Format with line breaks every 64 characters
    const formattedKey = base64Key.match(/.{1,64}/g)?.join('\n') || base64Key

    return `${header}\n${formattedKey}\n${footer}`
  } catch (error) {
    logger.error('Error converting hex to PEM', { error, type })
    throw ErrorFactory.fromError(error, 'Failed to convert key to PEM format', {
      source: 'cryptoUtils.hexToPEM',
    })
  }
}

/**
 * Validate ECDSA signature
 */
export async function validateSignature(
  message: string,
  signature: string,
  publicKeyHex: string,
): Promise<boolean> {
  try {
    // Convert message to bytes
    const messageBytes = Buffer.from(message, 'utf8')

    // Hash the message (SHA-256)
    const crypto = await import('crypto')
    const hash = crypto.createHash('sha256').update(messageBytes).digest()

    // Convert signature from hex
    const signatureBytes = Buffer.from(signature, 'hex')

    // Parse signature (r, s values)
    const r = BigInt('0x' + signatureBytes.subarray(0, 32).toString('hex'))
    const s = BigInt('0x' + signatureBytes.subarray(32, 64).toString('hex'))

    // Parse public key
    const publicKeyPoint = p256.ProjectivePoint.fromHex(publicKeyHex)

    // Verify signature - convert hash to hex for noble-curves
    const hashHex = hash.toString('hex')
    const isValid = p256.verify({ r, s }, hashHex, publicKeyPoint.toRawBytes())

    return isValid
  } catch (error) {
    logger.error('Error validating signature', { error })

    return false
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}
