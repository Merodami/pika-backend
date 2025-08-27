import type { KeyObject } from 'jose'
import { importPKCS8, importSPKI } from 'jose'

import { prepareRSAKey } from '../utils/rsaKeyPreparation.js'

// KeyLike type for jose - can be KeyObject (node), CryptoKey (browser), or Uint8Array (symmetric)
type KeyLike = KeyObject | CryptoKey | Uint8Array

/**
 * KeyManager - Runtime key caching and management
 *
 * Loads cryptographic keys once at startup, validates them,
 * and serves them from memory cache for blazing fast performance.
 *
 * Extensible design for future additions (database pools, SDK clients, etc.)
 */
export class KeyManager {
  private static instance: KeyManager
  private readonly cache: Map<string, KeyLike | string> = new Map()
  private initialized = false

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager()
    }

    return KeyManager.instance
  }

  /**
   * Initialize the KeyManager with all required keys
   * Should be called once at application startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('KeyManager already initialized')

      return
    }

    console.log('Initializing KeyManager...')

    try {
      // Load JWT keys
      await this.loadJWTKeys()

      // Load Voucher JWT keys
      await this.loadVoucherJWTKeys()

      this.initialized = true
      console.log('✅ KeyManager initialized successfully')
    } catch (error) {
      console.error('❌ KeyManager initialization failed:', error)
      throw new Error(
        `KeyManager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Load and cache JWT signing/verification keys
   */
  private async loadJWTKeys(): Promise<void> {
    const algorithm = process.env.JWT_ALGORITHM || 'RS256'

    if (algorithm !== 'RS256') {
      throw new Error(
        `Unsupported JWT algorithm: ${algorithm}. Only RS256 is supported.`,
      )
    }

    // Load RSA keys for RS256
    const privateKeyData = process.env.JWT_PRIVATE_KEY
    const publicKeyData = process.env.JWT_PUBLIC_KEY

    if (!privateKeyData || !publicKeyData) {
      throw new Error(
        'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required for RS256',
      )
    }

    // Process keys to PEM format using existing utility (for jsonwebtoken)
    const privatePEM = prepareRSAKey(privateKeyData, 'PRIVATE')
    const publicPEM = prepareRSAKey(publicKeyData, 'PUBLIC')

    // Store PEM strings for jsonwebtoken compatibility
    this.cache.set('jwt.private.pem', privatePEM)
    this.cache.set('jwt.public.pem', publicPEM)

    // Also process and import as KeyLike for jose (future use)
    const privateKey = await this.processRSAKey(privateKeyData, 'PRIVATE')
    const publicKey = await this.processRSAKey(publicKeyData, 'PUBLIC')

    this.cache.set('jwt.private', privateKey)
    this.cache.set('jwt.public', publicKey)

    console.log(
      '  ✓ JWT RS256 keys loaded and cached (both PEM and KeyLike formats)',
    )
  }

  /**
   * Load and cache Voucher JWT keys
   */
  private async loadVoucherJWTKeys(): Promise<void> {
    const algorithm = process.env.VOUCHER_JWT_ALGORITHM || 'RS256'

    if (algorithm === 'RS256') {
      const privateKeyData = process.env.VOUCHER_JWT_PRIVATE_KEY
      const publicKeyData = process.env.VOUCHER_JWT_PUBLIC_KEY

      if (!privateKeyData || !publicKeyData) {
        console.log('  ⚠️  Voucher JWT keys not configured (optional)')

        return
      }

      // Process keys to PEM format using existing utility (for jsonwebtoken)
      const privatePEM = prepareRSAKey(privateKeyData, 'PRIVATE')
      const publicPEM = prepareRSAKey(publicKeyData, 'PUBLIC')

      // Store PEM strings for jsonwebtoken compatibility
      this.cache.set('voucher.jwt.private.pem', privatePEM)
      this.cache.set('voucher.jwt.public.pem', publicPEM)

      // Also process and import as KeyLike for jose (future use)
      const privateKey = await this.processRSAKey(privateKeyData, 'PRIVATE')
      const publicKey = await this.processRSAKey(publicKeyData, 'PUBLIC')

      this.cache.set('voucher.jwt.private', privateKey)
      this.cache.set('voucher.jwt.public', publicKey)

      console.log(
        '  ✓ Voucher JWT RS256 keys loaded and cached (both PEM and KeyLike formats)',
      )
    }
  }

  /**
   * Process an RSA key from various formats
   * Handles base64, escaped newlines, and PEM formats
   */
  private async processRSAKey(
    keyData: string,
    type: 'PRIVATE' | 'PUBLIC',
  ): Promise<KeyLike> {
    let pemKey = keyData

    // Handle base64 encoded keys
    if (!keyData.includes('-----BEGIN')) {
      try {
        const decoded = Buffer.from(keyData, 'base64').toString('utf-8')

        if (decoded.includes('-----BEGIN')) {
          pemKey = decoded
        }
      } catch {
        // Not base64, use as is
      }
    }

    // Handle escaped newlines
    if (pemKey.includes('\\n') && !pemKey.includes('\n')) {
      pemKey = pemKey.replace(/\\n/g, '\n')
    }

    // Import the key using jose
    try {
      if (type === 'PRIVATE') {
        return await importPKCS8(pemKey, 'RS256')
      } else {
        return await importSPKI(pemKey, 'RS256')
      }
    } catch (error) {
      throw new Error(
        `Failed to import ${type} key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Check if KeyManager is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Clear all cached keys (useful for testing)
   */
  clear(): void {
    this.cache.clear()
    this.initialized = false
  }

  /**
   * Get JWT private key in PEM format for jsonwebtoken
   */
  getJWTPrivateKeyPEM(): string {
    const key = this.cache.get('jwt.private.pem')

    if (!key) {
      throw new Error(
        'JWT private key (PEM) not initialized. Call initialize() first.',
      )
    }

    return key as string
  }

  /**
   * Get JWT public key in PEM format for jsonwebtoken
   */
  getJWTPublicKeyPEM(): string {
    const key = this.cache.get('jwt.public.pem')

    if (!key) {
      throw new Error(
        'JWT public key (PEM) not initialized. Call initialize() first.',
      )
    }

    return key as string
  }

  /**
   * Get Voucher JWT private key in PEM format
   */
  getVoucherJWTPrivateKeyPEM(): string | undefined {
    return this.cache.get('voucher.jwt.private.pem') as string | undefined
  }

  /**
   * Get Voucher JWT public key in PEM format
   */
  getVoucherJWTPublicKeyPEM(): string | undefined {
    return this.cache.get('voucher.jwt.public.pem') as string | undefined
  }

  /**
   * Get cache statistics (for monitoring/debugging)
   */
  getStats(): { initialized: boolean; keysLoaded: number; keys: string[] } {
    return {
      initialized: this.initialized,
      keysLoaded: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const keyManager = KeyManager.getInstance()
