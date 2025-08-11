import { DevicePlatform } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../common/utils/zodEnum.js'

/**
 * Device information schemas matching @pika/types
 *
 * Schema Organization:
 * - Raw Zod schemas (no suffix) - for validation
 * - OpenAPI schemas (Schema suffix) - for documentation
 */

// ============= Device Info =============

/**
 * Device information (raw Zod)
 * Matches @pika/types DeviceInfo interface
 * Used in VoucherScanRequest
 */
export const DeviceInfo = z.object({
  userAgent: z.string().optional(),
  platform: createZodEnum(DevicePlatform).optional(),
  appVersion: z.string().optional(),
  deviceId: z.string().optional(),
})

export type DeviceInfo = z.infer<typeof DeviceInfo>

/**
 * Device information (OpenAPI documented with reference)
 * This will generate $ref when used in OpenAPI schemas
 */
export const DeviceInfoSchema = DeviceInfo.openapi('DeviceInfo', {
  description: 'Device information for tracking',
  example: {
    userAgent: 'Mozilla/5.0',
    platform: DevicePlatform.IOS,
    appVersion: '1.2.3',
    deviceId: 'device-123',
  },
})
