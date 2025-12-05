#!/usr/bin/env tsx
/**
 * Generate RSA key pairs for JWT signing
 *
 * Usage:
 *   yarn tsx scripts/generate-rsa-keys.ts [options]
 *
 * Options:
 *   --format base64|pem|both  Output format (default: both)
 *   --type jwt|voucher|both    Key type to generate (default: both)
 *   --size 2048|4096          Key size in bits (default: 2048)
 *   --save, --file            Save to a new file (never modifies .env)
 */

import { generateKeyPairSync } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = process.argv.slice(2)
const getArg = (name: string, defaultValue: string) => {
  const index = args.findIndex((arg) => arg.startsWith(`--${name}`))
  if (index === -1) return defaultValue
  const value = args[index].split('=')[1] || args[index + 1]
  return value || defaultValue
}

const format = getArg('format', 'both')
const type = getArg('type', 'both')
const keySize = parseInt(getArg('size', '2048'))
const shouldSave = args.includes('--save') || args.includes('--file')

// Validate arguments
if (!['base64', 'pem', 'both'].includes(format)) {
  console.error('❌ Invalid format. Use: base64, pem, or both')
  process.exit(1)
}

if (!['jwt', 'voucher', 'both'].includes(type)) {
  console.error('❌ Invalid type. Use: jwt, voucher, or both')
  process.exit(1)
}

if (![2048, 4096].includes(keySize)) {
  console.error('❌ Invalid key size. Use: 2048 or 4096')
  process.exit(1)
}

interface KeyPair {
  privateKey: string
  publicKey: string
  privateKeyBase64: string
  publicKeyBase64: string
}

/**
 * Generate an RSA key pair
 */
function generateRSAKeyPair(size: number = 2048): KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: size,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  // Convert to base64 for easy storage
  const privateKeyBase64 = Buffer.from(privateKey).toString('base64')
  const publicKeyBase64 = Buffer.from(publicKey).toString('base64')

  return {
    privateKey,
    publicKey,
    privateKeyBase64,
    publicKeyBase64,
  }
}

/**
 * Display keys in requested format
 */
function displayKeys(name: string, keys: KeyPair, format: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔐 ${name} Keys (${keySize}-bit RSA)`)
  console.log('='.repeat(60))

  if (format === 'pem' || format === 'both') {
    console.log('\n📄 PEM Format (for local development):')
    console.log('----------------------------------------')
    console.log(`${name}_PRIVATE_KEY="${keys.privateKey.replace(/\n/g, '')}"`)
    console.log()
    console.log(`${name}_PUBLIC_KEY="${keys.publicKey.replace(/\n/g, '')}"`)
  }

  if (format === 'base64' || format === 'both') {
    console.log('\n📦 Base64 Format (for Vercel/production):')
    console.log('------------------------------------------')
    console.log(`${name}_PRIVATE_KEY="${keys.privateKeyBase64}"`)
    console.log()
    console.log(`${name}_PUBLIC_KEY="${keys.publicKeyBase64}"`)
  }
}

/**
 * Save keys to a new file
 */
function saveToFile(
  jwtKeys?: KeyPair,
  voucherKeys?: KeyPair,
  format: string = 'base64',
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `rsa-keys-${timestamp}.env`
  const filepath = path.join(__dirname, '..', filename)

  let content = '# Generated RSA Keys for VoucherBook\n'
  content += `# Generated at: ${new Date().toISOString()}\n`
  content += `# Format: ${format}\n`
  content += `# Key Size: ${keySize} bits\n\n`

  if (format === 'base64' || format === 'both') {
    content += '# ============================================\n'
    content += '# Base64 Format (for Vercel/Production)\n'
    content += '# ============================================\n\n'

    if (jwtKeys) {
      content += '# JWT Keys\n'
      content += 'JWT_ALGORITHM="RS256"\n'
      content += `JWT_PRIVATE_KEY="${jwtKeys.privateKeyBase64}"\n`
      content += `JWT_PUBLIC_KEY="${jwtKeys.publicKeyBase64}"\n\n`
    }

    if (voucherKeys) {
      content += '# Voucher JWT Keys\n'
      content += 'VOUCHER_JWT_ALGORITHM="RS256"\n'
      content += `VOUCHER_JWT_PRIVATE_KEY="${voucherKeys.privateKeyBase64}"\n`
      content += `VOUCHER_JWT_PUBLIC_KEY="${voucherKeys.publicKeyBase64}"\n\n`
    }
  }

  if (format === 'pem' || format === 'both') {
    if (format === 'both') {
      content += '\n# ============================================\n'
      content += '# PEM Format (for local development)\n'
      content += '# ============================================\n\n'
    }

    if (jwtKeys) {
      content += '# JWT Keys (PEM format - single line for .env)\n'
      content += `JWT_PRIVATE_KEY="${jwtKeys.privateKey.replace(/\n/g, '')}"\n`
      content += `JWT_PUBLIC_KEY="${jwtKeys.publicKey.replace(/\n/g, '')}"\n\n`
    }

    if (voucherKeys) {
      content += '# Voucher JWT Keys (PEM format - single line for .env)\n'
      content += `VOUCHER_JWT_PRIVATE_KEY="${voucherKeys.privateKey.replace(/\n/g, '')}"\n`
      content += `VOUCHER_JWT_PUBLIC_KEY="${voucherKeys.publicKey.replace(/\n/g, '')}"\n\n`
    }
  }

  // Write to file
  fs.writeFileSync(filepath, content)
  console.log(`\n📄 Keys saved to: ${filename}`)
  console.log(`📍 Full path: ${filepath}`)
}

// Main execution
console.log('🔑 RSA Key Generator for VoucherBook')
console.log('=====================================\n')

let jwtKeys: KeyPair | undefined
let voucherKeys: KeyPair | undefined

if (type === 'jwt' || type === 'both') {
  jwtKeys = generateRSAKeyPair(keySize)
  displayKeys('JWT', jwtKeys, format)
}

if (type === 'voucher' || type === 'both') {
  voucherKeys = generateRSAKeyPair(keySize)
  displayKeys('VOUCHER_JWT', voucherKeys, format)
}

if (shouldSave) {
  console.log('\n💾 Saving to file...')
  saveToFile(
    type === 'jwt' || type === 'both' ? jwtKeys : undefined,
    type === 'voucher' || type === 'both' ? voucherKeys : undefined,
    format,
  )
}

console.log('\n' + '='.repeat(60))
console.log('📌 Next Steps:')
console.log('='.repeat(60))
console.log('1. Copy the Base64 keys to your Vercel environment variables')
console.log('2. Ensure JWT_ALGORITHM=RS256 in your environment')
console.log('3. Deploy your application')
console.log('\n✨ Keys generated successfully!')
