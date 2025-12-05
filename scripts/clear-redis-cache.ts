#!/usr/bin/env tsx
import { config } from 'dotenv'
import Redis from 'ioredis'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined

async function clearRedisCache() {
  console.log('🔄 Connecting to Redis...')
  console.log(`   Host: ${REDIS_HOST}:${REDIS_PORT}`)

  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    retryStrategy: () => null, // Don't retry on connection failure
  })

  try {
    // Check connection
    await redis.ping()
    console.log('✅ Connected to Redis successfully')

    // Flush all data from Redis
    console.log('🗑️  Flushing all Redis data...')
    await redis.flushall()

    console.log('✅ Successfully cleared all Redis cache')

    // Optional: Show memory stats
    const info = await redis.info('memory')
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim()

    if (usedMemory) {
      console.log(`📈 Redis memory usage: ${usedMemory}`)
    }
  } catch (error) {
    console.error('❌ Error clearing Redis cache:', error)
    process.exit(1)
  } finally {
    redis.disconnect()
    console.log('👋 Disconnected from Redis')
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
const showHelp = args.includes('--help') || args.includes('-h')
const force = args.includes('--force') || args.includes('-f')

if (showHelp) {
  console.log(`
Redis Cache Clear Utility
========================

Usage: yarn cache:clear [options]

Options:
  --force, -f    Clear cache without confirmation
  --help, -h     Show this help message

Environment Variables (from .env/.env.local):
  REDIS_HOST     Redis host (default: 127.0.0.1)
  REDIS_PORT     Redis port (default: 6379)
  REDIS_PASSWORD Redis password (optional)
  REDIS_PREFIX   Key prefix (default: thevoucherbook:)

Examples:
  yarn cache:clear           # Clear cache with confirmation
  yarn cache:clear --force   # Clear cache without confirmation
`)
  process.exit(0)
}

// Confirmation prompt if not forced
if (!force) {
  console.log('⚠️  This will FLUSH ALL Redis data!')
  console.log('   Use --force to skip this confirmation')
  console.log('')

  // Simple confirmation using readline
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  readline.question('Are you sure you want to continue? (y/N): ', (answer) => {
    readline.close()

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      clearRedisCache().catch((error) => {
        console.error('❌ Unexpected error:', error)
        process.exit(1)
      })
    } else {
      console.log('❌ Cache clear cancelled')
      process.exit(0)
    }
  })
} else {
  clearRedisCache().catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
}
