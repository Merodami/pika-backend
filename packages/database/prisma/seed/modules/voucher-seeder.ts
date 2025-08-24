import { VoucherState } from '@pika/types'
import type { PrismaClient } from '@prisma/client'

import { FIXED_DEV_IDS } from './fixed-ids.js'
import type { SeedModule } from './types.js'
import type { ImageSeedingResult } from './image-seeder.js'
import { getRandomVoucherImage } from './image-seeder.js'

/**
 * Voucher Seeder Module
 * Creates 10 vouchers (5 per business) with complete translations
 * Uses the existing translation table system with titleKey, descriptionKey, termsAndConditionsKey
 */

const DEV_VOUCHERS_DATA = [
  // Restaurant vouchers (5)
  {
    id: FIXED_DEV_IDS.vouchers.restaurant.discount20,
    businessId: FIXED_DEV_IDS.businesses.restaurant,
    categoryId: FIXED_DEV_IDS.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.discount-20.title',
    descriptionKey: 'dev.voucher.restaurant.discount-20.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.discount-20.terms',
    type: 'percentage' as const,
    discount: 20,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '20% de descuento en tu primera visita',
        en: '20% off on your first visit',
        gn: "20% jepi neike oúva rehe"
      },
      description: {
        es: 'Obtén 20% de descuento en toda tu orden en tu primera visita a nuestro restaurante',
        en: 'Get 20% discount on your entire order on your first visit to our restaurant',
        gn: "20% jepi ereko neike tembi'u pedido tuichakue rehe ore restaurante-pe"
      },
      terms: {
        es: 'Válido solo para nuevos clientes. No acumulable con otras promociones.',
        en: 'Valid only for new customers. Cannot be combined with other promotions.',
        gn: "Oikovante cliente pyahu-pe g̃uarã. Ndaikatúi oñembojuaju ambue promoción ndive."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.restaurant.freeDessert,
    businessId: FIXED_DEV_IDS.businesses.restaurant,
    categoryId: FIXED_DEV_IDS.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.free-dessert.title',
    descriptionKey: 'dev.voucher.restaurant.free-dessert.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.free-dessert.terms',
    type: 'fixed' as const,
    value: 0,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 50,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-06-30'),
    translations: {
      title: {
        es: 'Postre gratis comprando plato principal',
        en: 'Free dessert with main course purchase',
        gn: "Dulce reirei tembi'u tuichakue jeguata rehe"
      },
      description: {
        es: 'Recibe un postre gratis al comprar cualquier plato principal de nuestro menú',
        en: 'Get a free dessert when purchasing any main course from our menu',
        gn: "Ereko dulce reirei ejogua jave oimeraẽ tembi'u tuichakue ore menú-gui"
      },
      terms: {
        es: 'Válido de lunes a viernes. Sujeto a disponibilidad del postre.',
        en: 'Valid Monday to Friday. Subject to dessert availability.',
        gn: "Oikovante lunes-gui viernes peve. Odepende dulce oĩ hagrã."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.restaurant.familyCombo,
    businessId: FIXED_DEV_IDS.businesses.restaurant,
    categoryId: FIXED_DEV_IDS.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.combo-family.title',
    descriptionKey: 'dev.voucher.restaurant.combo-family.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.combo-family.terms',
    type: 'percentage' as const,
    discount: 15,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 30,
    maxRedemptionsPerUser: 2,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '15% descuento en combo familiar',
        en: '15% off family combo',
        gn: "15% jepi combo familia rehegua rehe"
      },
      description: {
        es: 'Descuento especial en nuestro combo familiar para 4 personas',
        en: 'Special discount on our family combo for 4 people',
        gn: "Jepi especial ore combo familia 4 tapicha-pe g̃uarã rehe"
      },
      terms: {
        es: 'Solo fines de semana. Mínimo 4 personas.',
        en: 'Weekends only. Minimum 4 people.',
        gn: "Arapokõindy año. Sa'ive 4 tapicha."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.restaurant.happyHour,
    businessId: FIXED_DEV_IDS.businesses.restaurant,
    categoryId: FIXED_DEV_IDS.categories.cafes,
    titleKey: 'dev.voucher.restaurant.happy-hour.title',
    descriptionKey: 'dev.voucher.restaurant.happy-hour.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.happy-hour.terms',
    type: 'percentage' as const,
    discount: 30,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 200,
    maxRedemptionsPerUser: 5,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Happy Hour: 30% en bebidas',
        en: 'Happy Hour: 30% off drinks',
        gn: "Happy Hour: 30% jepi y rehe"
      },
      description: {
        es: '30% de descuento en todas las bebidas de 4 a 6 PM',
        en: '30% discount on all drinks from 4 to 6 PM',
        gn: "30% jepi opaite y rehe 4-gui 6 PM peve"
      },
      terms: {
        es: 'Válido de lunes a viernes de 4 a 6 PM únicamente.',
        en: 'Valid Monday to Friday from 4 to 6 PM only.',
        gn: "Oikovante lunes-gui viernes peve 4-gui 6 PM peve año."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.restaurant.birthday,
    businessId: FIXED_DEV_IDS.businesses.restaurant,
    categoryId: FIXED_DEV_IDS.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.birthday.title',
    descriptionKey: 'dev.voucher.restaurant.birthday.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.birthday.terms',
    type: 'percentage' as const,
    discount: 25,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 365,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '25% descuento por tu cumpleaños',
        en: '25% birthday discount',
        gn: "25% jepi neike arete rehe"
      },
      description: {
        es: 'Celebra tu cumpleaños con nosotros y obtén 25% de descuento',
        en: 'Celebrate your birthday with us and get 25% discount',
        gn: "Ñemoatiapy neike arete oréndive ha ereko 25% jepi"
      },
      terms: {
        es: 'Válido el día de tu cumpleaños. Presentar documento de identidad.',
        en: 'Valid on your birthday. Must present ID.',
        gn: "Oikovante neike arete ára-pe. Ehechauka ne documento."
      }
    }
  },

  // Beauty salon vouchers (5)
  {
    id: FIXED_DEV_IDS.vouchers.beauty.firstVisit,
    businessId: FIXED_DEV_IDS.businesses.beautySalon,
    categoryId: FIXED_DEV_IDS.categories.beauty,
    titleKey: 'dev.voucher.beauty.first-visit.title',
    descriptionKey: 'dev.voucher.beauty.first-visit.description',
    termsAndConditionsKey: 'dev.voucher.beauty.first-visit.terms',
    type: 'percentage' as const,
    discount: 30,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '30% descuento primera visita',
        en: '30% off first visit',
        gn: "30% jepi neike oúva rehe"
      },
      description: {
        es: 'Descuento especial del 30% en todos nuestros servicios para nuevos clientes',
        en: 'Special 30% discount on all our services for new clients',
        gn: "30% jepi especial opaite ore mbohapy cliente pyahu-pe"
      },
      terms: {
        es: 'Solo para nuevos clientes. No válido en tratamientos especiales.',
        en: 'New clients only. Not valid for special treatments.',
        gn: "Cliente pyahu-pe g̃uarã año. Ndaikovéi tratamiento especial-pe."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.beauty.spaPackage,
    businessId: FIXED_DEV_IDS.businesses.beautySalon,
    categoryId: FIXED_DEV_IDS.categories.beauty,
    titleKey: 'dev.voucher.beauty.spa-package.title',
    descriptionKey: 'dev.voucher.beauty.spa-package.description',
    termsAndConditionsKey: 'dev.voucher.beauty.spa-package.terms',
    type: 'percentage' as const,
    discount: 20,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 50,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Paquete Spa Completo - 20% OFF',
        en: 'Complete Spa Package - 20% OFF',
        gn: "Spa Paquete Opaite - 20% JEPI"
      },
      description: {
        es: '20% de descuento en nuestro paquete spa completo: masajes, facial y manicura',
        en: '20% discount on our complete spa package: massage, facial and manicure',
        gn: "20% jepi ore spa paquete opaite: masaje, facial ha manicura"
      },
      terms: {
        es: 'Reserva con 48 horas de anticipación. Duración 3 horas.',
        en: 'Book 48 hours in advance. Duration 3 hours.',
        gn: "Ereserva 48 hora mboyve. Ipuka 3 hora."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.beauty.hairTreatment,
    businessId: FIXED_DEV_IDS.businesses.beautySalon,
    categoryId: FIXED_DEV_IDS.categories.beauty,
    titleKey: 'dev.voucher.beauty.hair-treatment.title',
    descriptionKey: 'dev.voucher.beauty.hair-treatment.description',
    termsAndConditionsKey: 'dev.voucher.beauty.hair-treatment.terms',
    type: 'fixed' as const,
    value: 50000,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 75,
    maxRedemptionsPerUser: 2,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '₲50.000 descuento tratamiento capilar',
        en: '₲50,000 off hair treatment',
        gn: "₲50.000 jepi ñe'ẽ po ñembohapy rehe"
      },
      description: {
        es: 'Descuento fijo de ₲50.000 en cualquier tratamiento capilar profesional',
        en: 'Fixed ₲50,000 discount on any professional hair treatment',
        gn: "₲50.000 jepi fijo oimeraẽ ñe'ẽ po ñembohapy profesional-pe"
      },
      terms: {
        es: 'Válido en tratamientos de keratina, botox capilar y alisado.',
        en: 'Valid for keratin, hair botox and straightening treatments.',
        gn: "Oikovante keratina, ñe'ẽ po botox ha alisado ñembohapy-pe."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.beauty.manicurePedicure,
    businessId: FIXED_DEV_IDS.businesses.beautySalon,
    categoryId: FIXED_DEV_IDS.categories.beauty,
    titleKey: 'dev.voucher.beauty.manicure-pedicure.title',
    descriptionKey: 'dev.voucher.beauty.manicure-pedicure.description',
    termsAndConditionsKey: 'dev.voucher.beauty.manicure-pedicure.terms',
    type: 'percentage' as const,
    discount: 15,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 150,
    maxRedemptionsPerUser: 3,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Combo Manicura + Pedicura 15% OFF',
        en: 'Manicure + Pedicure Combo 15% OFF',
        gn: "Combo Manicura + Pedicura 15% JEPI"
      },
      description: {
        es: '15% de descuento en combo manicura y pedicura con esmaltado semipermanente',
        en: '15% discount on manicure and pedicure combo with semi-permanent polish',
        gn: "15% jepi combo manicura ha pedicura esmalte semipermanente ndive"
      },
      terms: {
        es: 'Incluye limado, cutícula y esmaltado. Diseños adicionales se cobran aparte.',
        en: 'Includes filing, cuticle and polish. Additional designs charged separately.',
        gn: "Oike limado, cutícula ha esmaltado. Diseño joaju oñekobrapa ambuépe."
      }
    }
  },
  {
    id: FIXED_DEV_IDS.vouchers.beauty.facialAntiAging,
    businessId: FIXED_DEV_IDS.businesses.beautySalon,
    categoryId: FIXED_DEV_IDS.categories.beauty,
    titleKey: 'dev.voucher.beauty.facial-anti-aging.title',
    descriptionKey: 'dev.voucher.beauty.facial-anti-aging.description',
    termsAndConditionsKey: 'dev.voucher.beauty.facial-anti-aging.terms',
    type: 'percentage' as const,
    discount: 25,
    currency: 'PYG',
    state: VoucherState.PUBLISHED,
    maxRedemptions: 40,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Facial Anti-Edad Premium 25% OFF',
        en: 'Premium Anti-Aging Facial 25% OFF',
        gn: "Facial Anti-Edad Premium 25% JEPI"
      },
      description: {
        es: 'Tratamiento facial anti-edad con tecnología avanzada y productos premium',
        en: 'Anti-aging facial treatment with advanced technology and premium products',
        gn: "Facial ñembohapy anti-edad tecnología avanzada ha producto premium ndive"
      },
      terms: {
        es: 'Solo mayores de 35 años. Incluye consulta previa con especialista.',
        en: 'Ages 35+ only. Includes prior consultation with specialist.',
        gn: "35 ary guive año. Oike consulta mboyve especialista ndive."
      }
    }
  }
] as const

/**
 * Seed vouchers with translations
 */
async function seedVouchers(
  prisma: PrismaClient,
  images?: ImageSeedingResult
): Promise<void> {
  console.log('🎫 Seeding dev vouchers...')

  let vouchersCreated = 0
  let translationsCreated = 0
  let restaurantVouchers = 0
  let beautyVouchers = 0

  try {
    for (const voucherData of DEV_VOUCHERS_DATA) {
      const { translations, ...voucher } = voucherData

      // Assign a voucher image if available
      const imageUrl = images && images.voucherImages.length > 0
        ? getRandomVoucherImage(images.voucherImages)
        : undefined

      // Create/update voucher
      await prisma.voucher.upsert({
        where: { id: voucher.id },
        update: {
          titleKey: voucher.titleKey,
          descriptionKey: voucher.descriptionKey,
          termsAndConditionsKey: voucher.termsAndConditionsKey,
          type: voucher.type,
          discount: voucher.discount,
          value: voucher.value,
          currency: voucher.currency,
          state: voucher.state,
          maxRedemptions: voucher.maxRedemptions,
          maxRedemptionsPerUser: voucher.maxRedemptionsPerUser,
          validFrom: voucher.validFrom,
          validUntil: voucher.validUntil,
          imageUrl,
        },
        create: {
          ...voucher,
          imageUrl,
        },
      })

      vouchersCreated++

      // Count by business
      if (voucher.businessId === FIXED_DEV_IDS.businesses.restaurant) {
        restaurantVouchers++
      } else if (voucher.businessId === FIXED_DEV_IDS.businesses.beautySalon) {
        beautyVouchers++
      }

      // Create translations for title
      for (const [langCode, value] of Object.entries(translations.title)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: voucher.titleKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: voucher.titleKey,
            value,
            languageCode: langCode,
          },
        })
        translationsCreated++
      }

      // Create translations for description
      for (const [langCode, value] of Object.entries(translations.description)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: voucher.descriptionKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: voucher.descriptionKey,
            value,
            languageCode: langCode,
          },
        })
        translationsCreated++
      }

      // Create translations for terms
      for (const [langCode, value] of Object.entries(translations.terms)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: voucher.termsAndConditionsKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: voucher.termsAndConditionsKey,
            value,
            languageCode: langCode,
          },
        })
        translationsCreated++
      }

      console.log(`  ✅ ${translations.title.en}`)
    }

    console.log(`✅ Vouchers seeded successfully:`)
    console.log(`   - ${vouchersCreated} vouchers created/updated`)
    console.log(`   - ${restaurantVouchers} restaurant vouchers`)
    console.log(`   - ${beautyVouchers} beauty salon vouchers`)
    console.log(`   - ${translationsCreated} translations created/updated`)
    console.log(`   - All vouchers published and ready`)

  } catch (error) {
    console.error('❌ Failed to seed vouchers:', error)
    throw error
  }
}

/**
 * Cleanup vouchers and their translations
 */
async function cleanupVouchers(prisma: PrismaClient): Promise<void> {
  console.log('🗑️ Cleaning up dev vouchers...')

  try {
    // Get all voucher IDs
    const restaurantVoucherIds = Object.values(FIXED_DEV_IDS.vouchers.restaurant)
    const beautyVoucherIds = Object.values(FIXED_DEV_IDS.vouchers.beauty)
    const allVoucherIds = [...restaurantVoucherIds, ...beautyVoucherIds]

    // Delete voucher translations
    const voucherKeys = DEV_VOUCHERS_DATA.flatMap(v => [
      v.titleKey,
      v.descriptionKey,
      v.termsAndConditionsKey,
    ])
    const deletedTranslations = await prisma.translation.deleteMany({
      where: { key: { in: voucherKeys } },
    })

    // Delete vouchers
    const deletedVouchers = await prisma.voucher.deleteMany({
      where: { id: { in: allVoucherIds } },
    })

    console.log(`✅ Vouchers cleanup completed:`)
    console.log(`   - ${deletedVouchers.count} vouchers deleted`)
    console.log(`   - ${deletedTranslations.count} translations deleted`)

  } catch (error) {
    console.error('❌ Failed to cleanup vouchers:', error)
    throw error
  }
}

/**
 * Check voucher status
 */
async function checkVouchers(prisma: PrismaClient): Promise<boolean> {
  try {
    const restaurantVoucherIds = Object.values(FIXED_DEV_IDS.vouchers.restaurant)
    const beautyVoucherIds = Object.values(FIXED_DEV_IDS.vouchers.beauty)
    const allVoucherIds = [...restaurantVoucherIds, ...beautyVoucherIds]

    const vouchers = await prisma.voucher.findMany({
      where: { id: { in: allVoucherIds } },
      select: {
        id: true,
        titleKey: true,
        state: true,
        businessId: true,
        type: true,
        discount: true,
        value: true,
      },
    })

    const restaurantCount = vouchers.filter(v => v.businessId === FIXED_DEV_IDS.businesses.restaurant).length
    const beautyCount = vouchers.filter(v => v.businessId === FIXED_DEV_IDS.businesses.beautySalon).length

    console.log(`📊 Vouchers status: ${vouchers.length}/${allVoucherIds.length} found`)
    console.log(`   - Restaurant vouchers: ${restaurantCount}/5`)
    console.log(`   - Beauty salon vouchers: ${beautyCount}/5`)

    if (vouchers.length === allVoucherIds.length) {
      console.log(`✅ All vouchers exist`)

      return true
    } else {
      console.log(`⚠️ Missing ${allVoucherIds.length - vouchers.length} vouchers`)

      return false
    }
  } catch (error) {
    console.error('❌ Failed to check vouchers:', error)

    return false
  }
}

export const VOUCHER_MODULE: SeedModule = {
  name: 'Vouchers',
  description: '10 vouchers (5 per business) with ES/EN/GN translations',
  dependencies: ['User', 'Categories', 'Businesses'],
  seed: seedVouchers,
  cleanup: cleanupVouchers,
  check: checkVouchers,
}