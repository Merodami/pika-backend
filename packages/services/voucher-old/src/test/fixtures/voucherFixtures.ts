// src/test/fixtures/voucherFixtures.ts

// Import SDK types to ensure fixtures match API contracts
import { Voucher, VoucherCode, VoucherCreate, VoucherUpdate } from '@pika/sdk'
import { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'

/**
 * Fixture factory for Voucher tests
 */
export const createFixture = {
  /**
   * Create a complete Voucher with all fields
   * Uses SDK types to ensure compatibility with API contracts
   */
  voucher: (overrides: Partial<Voucher> = {}): Voucher => {
    const voucherId = overrides.id || uuid()
    const fixture: Voucher = {
      id: voucherId,
      provider_id: uuid(),
      category_id: uuid(),
      state: 'NEW',
      title: {
        en: `Test Voucher ${uuid().substring(0, 8)}`,
        es: `Cupón de Prueba ${uuid().substring(0, 8)}`,
        gn: `Test Voucher Guarani ${uuid().substring(0, 8)}`,
      },
      description: {
        en: `Get 20% off on your next purchase`,
        es: `Obtén 20% de descuento en tu próxima compra`,
        gn: `20% descuento próxima compra-pe`,
      },
      terms: {
        en: `Valid for one use per customer. Cannot be combined with other offers.`,
        es: `Válido para un uso por cliente. No se puede combinar con otras ofertas.`,
        gn: `Válido peteĩ jeporu cliente-pe. Ndaikatúi oñembojoaju ambue oferta ndive.`,
      },
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      currency: 'PYG',
      location: {
        type: 'Point',
        coordinates: [-57.575926, -25.363611], // Asunción coordinates
      },
      image_url: `https://example.com/vouchers/${uuid().substring(0, 8)}.png`,
      valid_from: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      max_redemptions: 100,
      max_redemptions_per_user: 1,
      current_redemptions: 0,
      metadata: {
        campaign: 'summer-sale',
        source: 'test-fixture',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      codes: [
        {
          id: uuid(),
          voucher_id: voucherId,
          code: 'TEST1234',
          type: 'SHORT',
          is_active: true,
          metadata: {},
        },
      ],
    }

    return { ...fixture, ...overrides }
  },

  /**
   * Create valid Voucher creation payload
   * Uses SDK types to ensure compatibility with API contracts
   */
  voucherCreate: (overrides: Partial<VoucherCreate> = {}): VoucherCreate => {
    const fixture: VoucherCreate = {
      provider_id: uuid(),
      category_id: uuid(),
      title: {
        en: `New Voucher ${uuid().substring(0, 8)}`,
        es: `Nuevo Cupón ${uuid().substring(0, 8)}`,
        gn: `Cupón Pyahu ${uuid().substring(0, 8)}`,
      },
      description: {
        en: `Special discount for our customers`,
        es: `Descuento especial para nuestros clientes`,
        gn: `Descuento especial ore cliente kuérape`,
      },
      terms: {
        en: `Valid until expiration date. One per customer.`,
        es: `Válido hasta la fecha de vencimiento. Uno por cliente.`,
        gn: `Ovaléta vencimiento peve. Peteĩ cliente-pe.`,
      },
      discount_type: 'PERCENTAGE',
      discount_value: 15,
      currency: 'PYG',
      location: {
        type: 'Point',
        coordinates: [-57.575926, -25.363611],
      },
      valid_from: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      max_redemptions: 50,
      max_redemptions_per_user: 1,
      code_config: {
        generate_qr: true,
        generate_short_code: true,
        generate_static_code: false,
      },
    }

    return { ...fixture, ...overrides }
  },

  /**
   * Create valid Voucher update payload
   * Uses SDK types to ensure compatibility with API contracts
   */
  voucherUpdate: (
    overrides: Partial<VoucherUpdate> = {},
  ): Partial<VoucherUpdate> => {
    const fixture: Partial<VoucherUpdate> = {
      title: {
        en: `Updated Voucher ${uuid().substring(0, 8)}`,
        es: `Cupón Actualizado ${uuid().substring(0, 8)}`,
        gn: `Cupón Oñemoambuéva ${uuid().substring(0, 8)}`,
      },
      description: {
        en: `Updated discount offer`,
        es: `Oferta de descuento actualizada`,
        gn: `Oferta descuento oñemoambuéva`,
      },
      discount_value: 25,
      max_redemptions: 75,
    }

    return { ...fixture, ...overrides }
  },

  /**
   * Create a voucher with specific state
   */
  voucherWithState: (
    state: 'NEW' | 'PUBLISHED' | 'CLAIMED' | 'REDEEMED' | 'EXPIRED',
    overrides: Partial<Voucher> = {},
  ): Voucher => {
    const baseOverrides: Partial<Voucher> = {
      state,
      ...overrides,
    }

    // Adjust fields based on state
    switch (state) {
      case 'REDEEMED':
        baseOverrides.current_redemptions = baseOverrides.max_redemptions || 100
        break
      case 'EXPIRED':
        baseOverrides.expires_at = new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString() // Yesterday
        break
      case 'CLAIMED':
        baseOverrides.current_redemptions = 1
        break
    }

    return createFixture.voucher(baseOverrides)
  },

  /**
   * Create voucher codes
   */
  voucherCode: (overrides: Partial<VoucherCode> = {}): VoucherCode => {
    const fixture: VoucherCode = {
      id: uuid(),
      voucher_id: uuid(),
      code: `CODE${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      type: 'SHORT',
      is_active: true,
      metadata: {},
    }

    return { ...fixture, ...overrides }
  },
}

/**
 * Creates and persists test vouchers in the database for integration tests
 * Uses test doubles rather than actual database connections for unit tests
 *
 * @param prisma - Prisma client instance (can be mock)
 * @param options - Configuration options for the fixtures
 * @returns Object containing created vouchers
 */
export async function seedTestVouchers(
  prisma: PrismaClient,
  options: {
    count?: number
    includeExpired?: boolean
    includeRedeemed?: boolean
  } = {},
) {
  const { count = 3, includeExpired = false, includeRedeemed = false } = options

  // Mocked response data for tests
  const vouchers = []

  // Create active vouchers
  for (let i = 0; i < count; i++) {
    const voucherId = uuid()
    const voucher = {
      id: voucherId,
      providerId: uuid(),
      categoryId: uuid(),
      state: 'PUBLISHED',
      title: {
        en: `Test Voucher ${i + 1}`,
        es: `Cupón de Prueba ${i + 1}`,
        gn: `Test Voucher ${i + 1}`,
      },
      description: {
        en: `Get ${(i + 1) * 10}% off`,
        es: `Obtén ${(i + 1) * 10}% de descuento`,
        gn: `${(i + 1) * 10}% descuento`,
      },
      terms: {
        en: 'Valid for one use',
        es: 'Válido para un uso',
        gn: 'Válido peteĩ jeporu',
      },
      discountType: 'PERCENTAGE',
      discountValue: (i + 1) * 10,
      currency: 'PYG',
      location: {
        type: 'Point',
        coordinates: [-57.575926, -25.363611],
      },
      imageUrl: null,
      validFrom: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxRedemptions: 100,
      maxRedemptionsPerUser: 1,
      currentRedemptions: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      codes: [
        {
          id: uuid(),
          voucherId: voucherId,
          code: `TEST${i}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          type: 'SHORT',
          isActive: true,
          metadata: {},
        },
      ],
    }

    vouchers.push(voucher)
  }

  // Create expired voucher if requested
  let expiredVoucher = null

  if (includeExpired) {
    const expiredId = uuid()

    expiredVoucher = {
      id: expiredId,
      providerId: uuid(),
      categoryId: uuid(),
      state: 'EXPIRED',
      title: {
        en: 'Expired Voucher',
        es: 'Cupón Vencido',
        gn: 'Cupón Vencido',
      },
      description: {
        en: 'This voucher has expired',
        es: 'Este cupón ha vencido',
        gn: 'Ko cupón oñembotýma',
      },
      terms: {
        en: 'No longer valid',
        es: 'Ya no es válido',
        gn: 'Ndoikoveíma',
      },
      discountType: 'PERCENTAGE',
      discountValue: 50,
      currency: 'PYG',
      location: {
        type: 'Point',
        coordinates: [-57.575926, -25.363611],
      },
      imageUrl: null,
      validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      maxRedemptions: 10,
      maxRedemptionsPerUser: 1,
      currentRedemptions: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      codes: [],
    }
  }

  // Create redeemed voucher if requested
  let redeemedVoucher = null

  if (includeRedeemed) {
    const redeemedId = uuid()

    redeemedVoucher = {
      id: redeemedId,
      providerId: uuid(),
      categoryId: uuid(),
      state: 'REDEEMED',
      title: {
        en: 'Fully Redeemed Voucher',
        es: 'Cupón Totalmente Canjeado',
        gn: 'Cupón Ojeporupaite',
      },
      description: {
        en: 'This voucher has been fully redeemed',
        es: 'Este cupón ha sido totalmente canjeado',
        gn: 'Ko cupón ojeporupaite',
      },
      terms: {
        en: 'Was valid for 10 uses',
        es: 'Era válido para 10 usos',
        gn: 'Ovaléta 10 jeporu',
      },
      discountType: 'FIXED',
      discountValue: 50000,
      currency: 'PYG',
      location: {
        type: 'Point',
        coordinates: [-57.575926, -25.363611],
      },
      imageUrl: null,
      validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
      maxRedemptions: 10,
      maxRedemptionsPerUser: 1,
      currentRedemptions: 10,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      codes: [],
    }
  }

  // In test environment, return mocked objects directly
  if (process.env.NODE_ENV === 'test') {
    return {
      vouchers,
      expiredVoucher,
      redeemedVoucher,
    }
  }

  // For actual integration tests with real database
  try {
    const createdVouchers = []

    for (const voucher of vouchers) {
      const created = await prisma.$transaction(async (tx) => {
        // Create voucher
        const v = await tx.voucher.create({
          data: {
            id: voucher.id,
            retailerId: voucher.retailerId,
            categoryId: voucher.categoryId,
            state: voucher.state,
            title: voucher.title,
            description: voucher.description,
            terms: voucher.terms,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            currency: voucher.currency,
            location: voucher.location,
            imageUrl: voucher.imageUrl,
            validFrom: voucher.validFrom,
            expiresAt: voucher.expiresAt,
            maxRedemptions: voucher.maxRedemptions,
            maxRedemptionsPerUser: voucher.maxRedemptionsPerUser,
            currentRedemptions: voucher.currentRedemptions,
            metadata: voucher.metadata,
          },
        })

        // Create codes
        if (voucher.codes.length > 0) {
          await tx.voucherCode.createMany({
            data: voucher.codes,
          })
        }

        return v
      })

      createdVouchers.push(created)
    }

    // Create expired voucher if requested
    let createdExpired = null

    if (expiredVoucher) {
      createdExpired = await prisma.voucher.create({
        data: expiredVoucher,
      })
    }

    // Create redeemed voucher if requested
    let createdRedeemed = null

    if (redeemedVoucher) {
      createdRedeemed = await prisma.voucher.create({
        data: redeemedVoucher,
      })
    }

    return {
      vouchers: createdVouchers,
      expiredVoucher: createdExpired,
      redeemedVoucher: createdRedeemed,
    }
  } catch (error) {
    console.error('Error seeding test vouchers:', error)
    throw error
  }
}
