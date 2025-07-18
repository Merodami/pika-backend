import type { FastifyInstance } from 'fastify'

import type { VoucherScanController } from '../controllers/voucher/VoucherScanController.js'

export interface VoucherScanRouterOptions {
  controller: VoucherScanController
}

/**
 * Routes for voucher scanning operations (customer-facing)
 */
export async function voucherScanRouter(
  fastify: FastifyInstance,
  options: VoucherScanRouterOptions,
): Promise<void> {
  const { controller } = options

  /**
   * Track a voucher scan (customer viewing)
   */
  fastify.post(
    '/vouchers/:voucherId/scan',
    {
      schema: {
        tags: ['Voucher Scanning'],
        summary: 'Track voucher scan',
        description:
          'Records a customer scan of a voucher QR code for analytics. Does not redeem the voucher.',
        params: {
          type: 'object',
          properties: {
            voucherId: {
              type: 'string',
              format: 'uuid',
              description: 'Voucher ID',
            },
          },
          required: ['voucherId'],
        },
        body: {
          type: 'object',
          properties: {
            scanSource: {
              type: 'string',
              enum: ['CAMERA', 'GALLERY', 'LINK', 'SHARE'],
              description: 'How the QR code was scanned',
            },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
              },
              required: ['latitude', 'longitude'],
            },
            deviceInfo: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                version: { type: 'string' },
                model: { type: 'string' },
              },
              required: ['platform', 'version'],
            },
          },
        },
      },
    },
    controller.trackScan,
  )

  /**
   * Claim a voucher to customer's wallet
   */
  fastify.post(
    '/vouchers/:voucherId/claim',
    {
      schema: {
        tags: ['Voucher Claiming'],
        summary: 'Claim voucher to wallet',
        description:
          "Claims a voucher to the authenticated customer's wallet. Does not redeem it.",
        params: {
          type: 'object',
          properties: {
            voucherId: {
              type: 'string',
              format: 'uuid',
              description: 'Voucher ID',
            },
          },
          required: ['voucherId'],
        },
        body: {
          type: 'object',
          properties: {
            notificationPreferences: {
              type: 'object',
              properties: {
                enableReminders: { type: 'boolean' },
                reminderDaysBefore: { type: 'number', minimum: 1, maximum: 30 },
              },
            },
          },
        },
      },
    },
    controller.claimVoucher,
  )
}
