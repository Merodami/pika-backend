import { describe, expect, it } from 'vitest'

import {
  convertKeyToBase64,
  isBase64EncodedKey,
  prepareRSAKey,
} from './rsaKeyPreparation.js'

describe('RSA Key Preparation', () => {
  // Sample keys for testing
  const samplePrivateKeyPEM = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1W8nQ3PXvJHKJ
zkvCz3mIJpnKSDycnVZBWbNd6dFtOmGWX3vDc4TgMz9Z/cOoXthyPKlnFD3Lndj+
qKvCXV/3L7IqNRAPcFfReJz/XNmNBVwz+hQJ9JWR59j4P8vp5T7/gQzS0OHeTp0E
xkzGq3v1lzC9g3l2412qQU5JvYNr4nlqPuK5MAJPTwg0PfZrlvoOm5Y1NHMRVlAN
-----END PRIVATE KEY-----`

  const samplePublicKeyPEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtVvJ0Nz17yRyic5Lws95
iCaZykg8nJ1WQVmzXenRbTphll97w3OE4DM/Wf3DqF7Ycjy5ZxQ9y53Y/qirwl1f
9y+yKjUQD3BX0Xic/1zZjQVcM/oUCfSVkefY+D/L6eU+/4EM0tDh3k6dBMZMxqt7
9ZcwvYN5duNdqkFOSb2Da+J5aj7iuTACT08IND32a5b6DpuWNTRzEVZQDQ==
-----END PUBLIC KEY-----`

  // Single line versions (as they come from environment variables)
  const samplePrivateKeySingleLine =
    '-----BEGIN PRIVATE KEY-----MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1W8nQ3PXvJHKJzkvCz3mIJpnKSDycnVZBWbNd6dFtOmGWX3vDc4TgMz9Z/cOoXthyPKlnFD3Lndj+qKvCXV/3L7IqNRAPcFfReJz/XNmNBVwz+hQJ9JWR59j4P8vp5T7/gQzS0OHeTp0ExkzGq3v1lzC9g3l2412qQU5JvYNr4nlqPuK5MAJPTwg0PfZrlvoOm5Y1NHMRVlAN-----END PRIVATE KEY-----'

  const samplePublicKeySingleLine =
    '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtVvJ0Nz17yRyic5Lws95iCaZykg8nJ1WQVmzXenRbTphll97w3OE4DM/Wf3DqF7Ycjy5ZxQ9y53Y/qirwl1f9y+yKjUQD3BX0Xic/1zZjQVcM/oUCfSVkefY+D/L6eU+/4EM0tDh3k6dBMZMxqt79ZcwvYN5duNdqkFOSb2Da+J5aj7iuTACT08IND32a5b6DpuWNTRzEVZQDQ==-----END PUBLIC KEY-----'

  // Base64 encoded versions
  const samplePrivateKeyBase64 =
    Buffer.from(samplePrivateKeyPEM).toString('base64')
  const samplePublicKeyBase64 =
    Buffer.from(samplePublicKeyPEM).toString('base64')

  describe('prepareRSAKey', () => {
    describe('Private Keys', () => {
      it('should handle base64 encoded private key', () => {
        const result = prepareRSAKey(samplePrivateKeyBase64, 'PRIVATE')

        expect(result).toContain('-----BEGIN PRIVATE KEY-----')
        expect(result).toContain('-----END PRIVATE KEY-----')
        expect(result).toContain('\n')
      })

      it('should handle single-line PEM private key', () => {
        const result = prepareRSAKey(samplePrivateKeySingleLine, 'PRIVATE')

        expect(result).toContain('-----BEGIN PRIVATE KEY-----')
        expect(result).toContain('-----END PRIVATE KEY-----')
        expect(result).toContain('\n')
        expect(result.split('\n').length).toBeGreaterThan(3)
      })

      it('should handle properly formatted multi-line private key', () => {
        const result = prepareRSAKey(samplePrivateKeyPEM, 'PRIVATE')

        expect(result).toBe(samplePrivateKeyPEM)
      })

      it('should handle empty private key', () => {
        const result = prepareRSAKey('', 'PRIVATE')

        expect(result).toBe('')
      })

      it('should handle private key with extra whitespace', () => {
        const keyWithSpaces =
          '-----BEGIN PRIVATE KEY-----  MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSk  -----END PRIVATE KEY-----'
        const result = prepareRSAKey(keyWithSpaces, 'PRIVATE')

        expect(result).toContain('-----BEGIN PRIVATE KEY-----')
        expect(result).toContain('-----END PRIVATE KEY-----')
        expect(result).not.toContain('  ')
      })
    })

    describe('Public Keys', () => {
      it('should handle base64 encoded public key', () => {
        const result = prepareRSAKey(samplePublicKeyBase64, 'PUBLIC')

        expect(result).toContain('-----BEGIN PUBLIC KEY-----')
        expect(result).toContain('-----END PUBLIC KEY-----')
        expect(result).toContain('\n')
      })

      it('should handle single-line PEM public key', () => {
        const result = prepareRSAKey(samplePublicKeySingleLine, 'PUBLIC')

        expect(result).toContain('-----BEGIN PUBLIC KEY-----')
        expect(result).toContain('-----END PUBLIC KEY-----')
        expect(result).toContain('\n')
        expect(result.split('\n').length).toBeGreaterThan(3)
      })

      it('should handle properly formatted multi-line public key', () => {
        const result = prepareRSAKey(samplePublicKeyPEM, 'PUBLIC')

        expect(result).toBe(samplePublicKeyPEM)
      })

      it('should handle empty public key', () => {
        const result = prepareRSAKey('', 'PUBLIC')

        expect(result).toBe('')
      })
    })

    describe('Key content validation', () => {
      it('should maintain key content integrity', () => {
        const result = prepareRSAKey(samplePrivateKeySingleLine, 'PRIVATE')
        // Extract just the key content (between headers)
        const originalContent = samplePrivateKeySingleLine
          .replace(/-----BEGIN.*?-----/, '')
          .replace(/-----END.*?-----/, '')
          .replace(/\s/g, '')

        const resultContent = result
          .replace(/-----BEGIN.*?-----/, '')
          .replace(/-----END.*?-----/, '')
          .replace(/\s/g, '')

        expect(resultContent).toBe(originalContent)
      })

      it('should format keys with 64-character lines', () => {
        const result = prepareRSAKey(samplePrivateKeySingleLine, 'PRIVATE')
        const lines = result.split('\n')

        // Check middle lines (not header/footer)
        for (let i = 1; i < lines.length - 2; i++) {
          if (lines[i]) {
            expect(lines[i].length).toBeLessThanOrEqual(64)
          }
        }
      })
    })
  })

  describe('isBase64EncodedKey', () => {
    it('should return true for base64 encoded key', () => {
      expect(isBase64EncodedKey(samplePrivateKeyBase64)).toBe(true)
      expect(isBase64EncodedKey(samplePublicKeyBase64)).toBe(true)
    })

    it('should return false for PEM format with headers', () => {
      expect(isBase64EncodedKey(samplePrivateKeyPEM)).toBe(false)
      expect(isBase64EncodedKey(samplePublicKeyPEM)).toBe(false)
      expect(isBase64EncodedKey(samplePrivateKeySingleLine)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isBase64EncodedKey('')).toBe(false)
    })

    it('should return false for invalid base64', () => {
      expect(isBase64EncodedKey('not-base64!@#$')).toBe(false)
    })

    it('should return false for base64 that doesnt decode to PEM', () => {
      const notAPem = Buffer.from('This is not a PEM key').toString('base64')

      expect(isBase64EncodedKey(notAPem)).toBe(false)
    })
  })

  describe('convertKeyToBase64', () => {
    it('should convert PEM to base64', () => {
      const result = convertKeyToBase64(samplePrivateKeyPEM)

      expect(result).toBe(samplePrivateKeyBase64)
    })

    it('should convert single-line PEM to base64', () => {
      const result = convertKeyToBase64(samplePrivateKeySingleLine)
      const decoded = Buffer.from(result, 'base64').toString('utf-8')

      expect(decoded).toBe(samplePrivateKeySingleLine)
    })

    it('should return base64 unchanged if already base64', () => {
      const result = convertKeyToBase64(samplePrivateKeyBase64)

      expect(result).toBe(samplePrivateKeyBase64)
    })

    it('should handle empty string', () => {
      const result = convertKeyToBase64('')

      expect(result).toBe('')
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle Vercel environment variable format', () => {
      // Simulating a key stored in Vercel (single line, no breaks)
      const vercelKey =
        '-----BEGIN PRIVATE KEY-----MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1W8nQ3PXvJHKJ-----END PRIVATE KEY-----'
      const result = prepareRSAKey(vercelKey, 'PRIVATE')

      expect(result).toContain('-----BEGIN PRIVATE KEY-----')
      expect(result).toContain('-----END PRIVATE KEY-----')
      expect(result.split('\n').length).toBeGreaterThan(2)
    })

    it('should handle base64 from production .env', () => {
      // Real base64 key like we're using in production
      const base64Key =
        'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdFZ2SjBOejE3eVJ5aWM1TAotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0t'
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8')

      // This would be a real key, so we check it decodes to PEM format
      expect(decoded).toContain('-----BEGIN')

      const result = prepareRSAKey(base64Key, 'PRIVATE')

      expect(result).toContain('-----BEGIN PRIVATE KEY-----')
      expect(result).toContain('-----END PRIVATE KEY-----')
    })

    it('should handle key without proper padding in base64', () => {
      // Sometimes base64 can lose padding
      const keyWithoutPadding = samplePrivateKeyBase64.replace(/=/g, '')
      const result = prepareRSAKey(keyWithoutPadding, 'PRIVATE')

      // Should still work (Node.js Buffer handles missing padding)
      expect(result).toContain('-----BEGIN PRIVATE KEY-----')
    })
  })
})
