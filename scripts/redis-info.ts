#!/usr/bin/env tsx
import { config } from 'dotenv'
import { resolve } from 'path'
import Redis from 'ioredis'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local'), override: true })

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'thevoucherbook:'

async function showRedisInfo() {
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    retryStrategy: () => null, // Don't retry on connection failure
  })

  try {
    // Check connection
    await redis.ping()
    console.log('📊 Redis Cache Information')
    console.log('='.repeat(50))
    console.log(`🔗 Connection: ${REDIS_HOST}:${REDIS_PORT}`)
    console.log(`🏷️  Prefix: ${REDIS_PREFIX}`)
    console.log('')

    // Get memory info
    const info = await redis.info('memory')
    const memoryStats = {
      used_memory_human: info.match(/used_memory_human:(.+)/)?.[1]?.trim(),
      used_memory_peak_human: info
        .match(/used_memory_peak_human:(.+)/)?.[1]
        ?.trim(),
      total_system_memory_human: info
        .match(/total_system_memory_human:(.+)/)?.[1]
        ?.trim(),
    }

    console.log('💾 Memory Usage:')
    console.log(`   Current: ${memoryStats.used_memory_human || 'N/A'}`)
    console.log(`   Peak: ${memoryStats.used_memory_peak_human || 'N/A'}`)
    console.log(
      `   System Total: ${memoryStats.total_system_memory_human || 'N/A'}`,
    )
    console.log('')

    // Get cache keys count
    const pattern = `${REDIS_PREFIX}*`
    const keys = await redis.keys(pattern)
    console.log('🔑 Cache Keys:')
    console.log(`   Total keys with prefix: ${keys.length}`)

    if (keys.length > 0) {
      // Group keys by pattern
      const keyPatterns = new Map<string, number>()
      keys.forEach((key) => {
        const pattern = key.replace(REDIS_PREFIX, '').split(':')[0]
        keyPatterns.set(pattern, (keyPatterns.get(pattern) || 0) + 1)
      })

      console.log('   Key patterns:')
      Array.from(keyPatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([pattern, count]) => {
          console.log(`     - ${pattern}: ${count} keys`)
        })

      if (keyPatterns.size > 10) {
        console.log(`     ... and ${keyPatterns.size - 10} more patterns`)
      }
    }
    console.log('')

    // Get server info
    const serverInfo = await redis.info('server')
    const version = serverInfo.match(/redis_version:(.+)/)?.[1]?.trim()
    const uptime = serverInfo.match(/uptime_in_seconds:(.+)/)?.[1]?.trim()

    if (version || uptime) {
      console.log('🖥️  Server Info:')
      if (version) console.log(`   Redis Version: ${version}`)
      if (uptime) {
        const uptimeHours = Math.floor(parseInt(uptime) / 3600)
        const uptimeDays = Math.floor(uptimeHours / 24)
        if (uptimeDays > 0) {
          console.log(
            `   Uptime: ${uptimeDays} days, ${uptimeHours % 24} hours`,
          )
        } else {
          console.log(`   Uptime: ${uptimeHours} hours`)
        }
      }
      console.log('')
    }

    // Get stats info
    const stats = await redis.info('stats')
    const totalConnections = stats
      .match(/total_connections_received:(.+)/)?.[1]
      ?.trim()
    const totalCommands = stats
      .match(/total_commands_processed:(.+)/)?.[1]
      ?.trim()
    const evictedKeys = stats.match(/evicted_keys:(.+)/)?.[1]?.trim()
    const expiredKeys = stats.match(/expired_keys:(.+)/)?.[1]?.trim()

    console.log('📈 Statistics:')
    if (totalConnections)
      console.log(
        `   Total connections: ${parseInt(totalConnections).toLocaleString()}`,
      )
    if (totalCommands)
      console.log(
        `   Total commands: ${parseInt(totalCommands).toLocaleString()}`,
      )
    if (expiredKeys && parseInt(expiredKeys) > 0)
      console.log(`   Expired keys: ${parseInt(expiredKeys).toLocaleString()}`)
    if (evictedKeys && parseInt(evictedKeys) > 0)
      console.log(`   Evicted keys: ${parseInt(evictedKeys).toLocaleString()}`)
  } catch (error) {
    console.error('❌ Error connecting to Redis:', error)
    console.log('')
    console.log('Make sure Redis is running:')
    console.log('  yarn docker:local')
    process.exit(1)
  } finally {
    redis.disconnect()
  }
}

showRedisInfo().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
