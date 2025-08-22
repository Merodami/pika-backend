import type { PrismaClient } from '@prisma/client'
import { v5 as uuidv5 } from 'uuid'

// Fixed namespace for generating predictable UUIDs
const DEV_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

// Generate predictable UUIDs for dev data
const generateFixedUUID = (seed: string): string => {
  return uuidv5(seed, DEV_NAMESPACE)
}

// Fixed UUIDs for dev entities (predictable for cleanup)
export const FIXED_DEV_ENTITIES = {
  user: generateFixedUUID('dev-business-owner'),
  businesses: {
    restaurant: generateFixedUUID('dev-business-restaurant'),
    beauty: generateFixedUUID('dev-business-beauty-salon'),
  },
  categories: {
    restaurants: generateFixedUUID('dev-category-restaurants'),
    fastFood: generateFixedUUID('dev-category-fast-food'),
    cafes: generateFixedUUID('dev-category-cafes'),
    beauty: generateFixedUUID('dev-category-beauty'),
    fitness: generateFixedUUID('dev-category-fitness'),
    retail: generateFixedUUID('dev-category-retail'),
    automotive: generateFixedUUID('dev-category-automotive'),
    healthcare: generateFixedUUID('dev-category-healthcare'),
    entertainment: generateFixedUUID('dev-category-entertainment'),
    education: generateFixedUUID('dev-category-education'),
  },
} as const

// Dev user data
const DEV_USER = {
  id: FIXED_DEV_ENTITIES.user,
  email: 'dev-business@voucherbook.dev',
  emailVerified: true,
  password: '$2b$10$rZ3qJHlFQl8NJ4OD2McPguKLJQhGwj5CQxVhKNXI1vHpQrF5J3RDu', // DevPassword123!
  firstName: 'Business',
  lastName: 'Owner',
  phoneNumber: '+595981234567',
  phoneVerified: true,
  role: 'business' as const,
  status: 'active' as const,
}

// Dev businesses data  
const DEV_BUSINESSES = [
  {
    id: FIXED_DEV_ENTITIES.businesses.restaurant,
    userId: FIXED_DEV_ENTITIES.user,
    businessNameKey: 'dev.business.restaurant.name',
    businessDescriptionKey: 'dev.business.restaurant.description',
    categoryId: FIXED_DEV_ENTITIES.categories.restaurants,
    verified: true,
    active: true,
    approved: true,
    avgRating: 4.5,
    translations: {
      name: {
        es: 'Restaurante El Sabor',
        en: 'The Flavor Restaurant', 
        gn: "Tembi'u Renda Hese",
      },
      description: {
        es: 'Restaurante de comida tradicional paraguaya con ambiente familiar',
        en: 'Traditional Paraguayan food restaurant with family atmosphere',
        gn: "Paraguái tembi'u tee renda familia rehegua",
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.businesses.beauty,
    userId: FIXED_DEV_ENTITIES.user,
    businessNameKey: 'dev.business.beauty.name',
    businessDescriptionKey: 'dev.business.beauty.description', 
    categoryId: FIXED_DEV_ENTITIES.categories.beauty,
    verified: true,
    active: true,
    approved: true,
    avgRating: 4.8,
    translations: {
      name: {
        es: 'Belleza & Estilo',
        en: 'Beauty & Style',
        gn: 'Iporã ha Estilo',
      },
      description: {
        es: 'Salón de belleza y spa con servicios integrales de cuidado personal',
        en: 'Beauty salon and spa with comprehensive personal care services',
        gn: 'Iporã salon ha spa ojeporu hag̃ua ñe' ñongatu',
      },
    },
  },
] as const

// Dev categories with complete translations
const DEV_CATEGORIES = [
  {
    id: FIXED_DEV_ENTITIES.categories.restaurants,
    nameKey: 'dev.category.restaurants.name',
    descriptionKey: 'dev.category.restaurants.description',
    icon: 'restaurant',
    slug: 'dev-restaurants',
    sortOrder: 1,
    translations: {
      name: {
        es: 'Restaurantes',
        en: 'Restaurants', 
        gn: "Tembi'u Renda",
      },
      description: {
        es: 'Restaurantes y establecimientos gastronómicos',
        en: 'Restaurants and gastronomic establishments',
        gn: "Tembi'u renda ha gastronomía renda",
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.fastFood,
    nameKey: 'dev.category.fast-food.name',
    descriptionKey: 'dev.category.fast-food.description',
    icon: 'fastfood',
    slug: 'dev-fast-food',
    sortOrder: 2,
    translations: {
      name: {
        es: 'Comida Rápida',
        en: 'Fast Food',
        gn: "Tembi'u Pya'e",
      },
      description: {
        es: 'Restaurantes de servicio rápido y comida para llevar',
        en: 'Quick service restaurants and takeaway food',
        gn: "Tembi'u pya'e ha ojegueraha",
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.cafes,
    nameKey: 'dev.category.cafes.name', 
    descriptionKey: 'dev.category.cafes.description',
    icon: 'coffee',
    slug: 'dev-cafes',
    sortOrder: 3,
    translations: {
      name: {
        es: 'Cafeterías',
        en: 'Cafés',
        gn: 'Kafé Renda',
      },
      description: {
        es: 'Cafeterías, panaderías y pastelerías',
        en: 'Coffee shops, bakeries and pastry stores',
        gn: 'Kafé renda, mbujape renda ha dulce renda',
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.beauty,
    nameKey: 'dev.category.beauty.name',
    descriptionKey: 'dev.category.beauty.description', 
    icon: 'face',
    slug: 'dev-beauty',
    sortOrder: 4,
    translations: {
      name: {
        es: 'Belleza y Bienestar',
        en: 'Beauty & Wellness',
        gn: 'Iporã ha Resapy',
      },
      description: {
        es: 'Salones de belleza, spas y servicios de bienestar',
        en: 'Beauty salons, spas and wellness services', 
        gn: 'Iporã salon, spa ha resapy mbohapy',
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.fitness,
    nameKey: 'dev.category.fitness.name',
    descriptionKey: 'dev.category.fitness.description',
    icon: 'fitness_center',
    slug: 'dev-fitness',
    sortOrder: 5,
    translations: {
      name: {
        es: 'Fitness y Deportes',
        en: 'Fitness & Sports',
        gn: 'Ejercicio ha Ñembosarai',
      },
      description: {
        es: 'Gimnasios, clubes deportivos y centros de fitness',
        en: 'Gyms, sports clubs and fitness centers',
        gn: 'Gimnasio, ñembosarai club ha ejercicio renda',
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.retail,
    nameKey: 'dev.category.retail.name',
    descriptionKey: 'dev.category.retail.description',
    icon: 'shopping_bag',
    slug: 'dev-retail',
    sortOrder: 6,
    translations: {
      name: {
        es: 'Tiendas y Retail',
        en: 'Stores & Retail',
        gn: 'Ñemuhenda ha Retail',
      },
      description: {
        es: 'Tiendas, boutiques y comercios al por menor',
        en: 'Stores, boutiques and retail businesses',
        gn: 'Ñemuhenda, boutique ha negocio ñemuhenda',
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.automotive,
    nameKey: 'dev.category.automotive.name',
    descriptionKey: 'dev.category.automotive.description',
    icon: 'directions_car',
    slug: 'dev-automotive',
    sortOrder: 7,
    translations: {
      name: {
        es: 'Automotriz',
        en: 'Automotive',
        gn: 'Auto ha Moto',
      },
      description: {
        es: 'Servicios automotrices, talleres y repuestos',
        en: 'Automotive services, workshops and spare parts',
        gn: 'Auto mbohapy, taller ha repuesto',
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.healthcare,
    nameKey: 'dev.category.healthcare.name',
    descriptionKey: 'dev.category.healthcare.description',
    icon: 'local_hospital',
    slug: 'dev-healthcare',
    sortOrder: 8,
    translations: {
      name: {
        es: 'Salud',
        en: 'Healthcare',
        gn: 'Resapy',
      },
      description: {
        es: 'Servicios médicos, clínicas y farmacias',
        en: 'Medical services, clinics and pharmacies',
        gn: 'Pohã mbohapy, klinika ha farmacia',
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.entertainment,
    nameKey: 'dev.category.entertainment.name',
    descriptionKey: 'dev.category.entertainment.description',
    icon: 'movie',
    slug: 'dev-entertainment',
    sortOrder: 9,
    translations: {
      name: {
        es: 'Entretenimiento',
        en: 'Entertainment',
        gn: "Vy'a",
      },
      description: {
        es: 'Cines, teatros y lugares de entretenimiento',
        en: 'Cinemas, theaters and entertainment venues',
        gn: "Ta'anga jehecha, teatro ha vy'a renda",
      },
    },
  },
  {
    id: FIXED_DEV_ENTITIES.categories.education,
    nameKey: 'dev.category.education.name',
    descriptionKey: 'dev.category.education.description',
    icon: 'school',
    slug: 'dev-education',
    sortOrder: 10,
    translations: {
      name: {
        es: 'Educación',
        en: 'Education',
        gn: 'Mboesapy',
      },
      description: {
        es: 'Escuelas, universidades y servicios educativos',
        en: 'Schools, universities and educational services',
        gn: 'Mboehao, universidad ha mboesapy mbohapy',
      },
    },
  },
] as const

// Dev vouchers (5 for restaurant, 5 for beauty salon)
const DEV_VOUCHERS = [
  // Restaurant vouchers
  {
    id: generateFixedUUID('dev-voucher-restaurant-1'),
    businessId: FIXED_DEV_ENTITIES.businesses.restaurant,
    categoryId: FIXED_DEV_ENTITIES.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.discount-20.title',
    descriptionKey: 'dev.voucher.restaurant.discount-20.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.discount-20.terms',
    type: 'percentage' as const,
    discount: 20,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '20% de descuento en tu primera visita',
        en: '20% off on your first visit',
        gn: '20% jepi neike oúva rehe',
      },
      description: {
        es: 'Obtén 20% de descuento en toda tu orden en tu primera visita a nuestro restaurante',
        en: 'Get 20% discount on your entire order on your first visit to our restaurant',
        gn: '20% jepi ereko neike tembi'u pedido tuichakue rehe ore restaurante-pe',
      },
      terms: {
        es: 'Válido solo para nuevos clientes. No acumulable con otras promociones.',
        en: 'Valid only for new customers. Cannot be combined with other promotions.',
        gn: 'Oikovante cliente pyahu-pe g̃uarã. Ndaikatúi oñembojuaju ambue promoción ndive.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-restaurant-2'),
    businessId: FIXED_DEV_ENTITIES.businesses.restaurant,
    categoryId: FIXED_DEV_ENTITIES.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.free-dessert.title',
    descriptionKey: 'dev.voucher.restaurant.free-dessert.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.free-dessert.terms',
    type: 'fixed' as const,
    value: 0, // Free item
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 50,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-06-30'),
    translations: {
      title: {
        es: 'Postre gratis comprando plato principal',
        en: 'Free dessert with main course purchase',
        gn: 'Dulce reirei tembi'u tuichakue jeguata rehe',
      },
      description: {
        es: 'Recibe un postre gratis al comprar cualquier plato principal de nuestro menú',
        en: 'Get a free dessert when purchasing any main course from our menu',
        gn: 'Ereko dulce reirei ejogua jave oimeraẽ tembi'u tuichakue ore menú-gui',
      },
      terms: {
        es: 'Válido de lunes a viernes. Sujeto a disponibilidad del postre.',
        en: 'Valid Monday to Friday. Subject to dessert availability.',
        gn: 'Oikovante lunes-gui viernes peve. Odepende dulce oĩ hagrã.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-restaurant-3'),
    businessId: FIXED_DEV_ENTITIES.businesses.restaurant,
    categoryId: FIXED_DEV_ENTITIES.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.combo-family.title',
    descriptionKey: 'dev.voucher.restaurant.combo-family.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.combo-family.terms',
    type: 'percentage' as const,
    discount: 15,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 30,
    maxRedemptionsPerUser: 2,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '15% descuento en combo familiar',
        en: '15% off family combo',
        gn: '15% jepi combo familia rehegua rehe',
      },
      description: {
        es: 'Descuento especial en nuestro combo familiar para 4 personas',
        en: 'Special discount on our family combo for 4 people',
        gn: 'Jepi especial ore combo familia 4 tapicha-pe g̃uarã rehe',
      },
      terms: {
        es: 'Solo fines de semana. Mínimo 4 personas.',
        en: 'Weekends only. Minimum 4 people.',
        gn: 'Arapokõindy año. Sa'ive 4 tapicha.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-restaurant-4'),
    businessId: FIXED_DEV_ENTITIES.businesses.restaurant,
    categoryId: FIXED_DEV_ENTITIES.categories.cafes,
    titleKey: 'dev.voucher.restaurant.happy-hour.title',
    descriptionKey: 'dev.voucher.restaurant.happy-hour.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.happy-hour.terms',
    type: 'percentage' as const,
    discount: 30,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 200,
    maxRedemptionsPerUser: 5,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Happy Hour: 30% en bebidas',
        en: 'Happy Hour: 30% off drinks',
        gn: 'Happy Hour: 30% jepi y rehe',
      },
      description: {
        es: '30% de descuento en todas las bebidas de 4 a 6 PM',
        en: '30% discount on all drinks from 4 to 6 PM',
        gn: '30% jepi opaite y rehe 4-gui 6 PM peve',
      },
      terms: {
        es: 'Válido de lunes a viernes de 4 a 6 PM únicamente.',
        en: 'Valid Monday to Friday from 4 to 6 PM only.',
        gn: 'Oikovante lunes-gui viernes peve 4-gui 6 PM peve año.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-restaurant-5'),
    businessId: FIXED_DEV_ENTITIES.businesses.restaurant,
    categoryId: FIXED_DEV_ENTITIES.categories.restaurants,
    titleKey: 'dev.voucher.restaurant.birthday.title',
    descriptionKey: 'dev.voucher.restaurant.birthday.description',
    termsAndConditionsKey: 'dev.voucher.restaurant.birthday.terms',
    type: 'percentage' as const,
    discount: 25,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 365,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '25% descuento por tu cumpleaños',
        en: '25% birthday discount',
        gn: '25% jepi neike arete rehe',
      },
      description: {
        es: 'Celebra tu cumpleaños con nosotros y obtén 25% de descuento',
        en: 'Celebrate your birthday with us and get 25% discount',
        gn: 'Ñemoatiapy neike arete oréndive ha ereko 25% jepi',
      },
      terms: {
        es: 'Válido el día de tu cumpleaños. Presentar documento de identidad.',
        en: 'Valid on your birthday. Must present ID.',
        gn: 'Oikovante neike arete ára-pe. Ehechauka ne documento.',
      },
    },
  },

  // Beauty salon vouchers
  {
    id: generateFixedUUID('dev-voucher-beauty-1'),
    businessId: FIXED_DEV_ENTITIES.businesses.beauty,
    categoryId: FIXED_DEV_ENTITIES.categories.beauty,
    titleKey: 'dev.voucher.beauty.first-visit.title',
    descriptionKey: 'dev.voucher.beauty.first-visit.description',
    termsAndConditionsKey: 'dev.voucher.beauty.first-visit.terms',
    type: 'percentage' as const,
    discount: 30,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '30% descuento primera visita',
        en: '30% off first visit',
        gn: '30% jepi neike oúva rehe',
      },
      description: {
        es: 'Descuento especial del 30% en todos nuestros servicios para nuevos clientes',
        en: 'Special 30% discount on all our services for new clients',
        gn: '30% jepi especial opaite ore mbohapy cliente pyahu-pe',
      },
      terms: {
        es: 'Solo para nuevos clientes. No válido en tratamientos especiales.',
        en: 'New clients only. Not valid for special treatments.',
        gn: 'Cliente pyahu-pe g̃uarã año. Ndaikovéi tratamiento especial-pe.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-beauty-2'),
    businessId: FIXED_DEV_ENTITIES.businesses.beauty,
    categoryId: FIXED_DEV_ENTITIES.categories.beauty,
    titleKey: 'dev.voucher.beauty.spa-package.title',
    descriptionKey: 'dev.voucher.beauty.spa-package.description',
    termsAndConditionsKey: 'dev.voucher.beauty.spa-package.terms',
    type: 'percentage' as const,
    discount: 20,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 50,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Paquete Spa Completo - 20% OFF',
        en: 'Complete Spa Package - 20% OFF',
        gn: 'Spa Paquete Opaite - 20% JEPI',
      },
      description: {
        es: '20% de descuento en nuestro paquete spa completo: masajes, facial y manicura',
        en: '20% discount on our complete spa package: massage, facial and manicure',
        gn: '20% jepi ore spa paquete opaite: masaje, facial ha manicura',
      },
      terms: {
        es: 'Reserva con 48 horas de anticipación. Duración 3 horas.',
        en: 'Book 48 hours in advance. Duration 3 hours.',
        gn: 'Ereserva 48 hora mboyve. Ipuka 3 hora.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-beauty-3'),
    businessId: FIXED_DEV_ENTITIES.businesses.beauty,
    categoryId: FIXED_DEV_ENTITIES.categories.beauty,
    titleKey: 'dev.voucher.beauty.hair-treatment.title',
    descriptionKey: 'dev.voucher.beauty.hair-treatment.description',
    termsAndConditionsKey: 'dev.voucher.beauty.hair-treatment.terms',
    type: 'fixed' as const,
    value: 50000, // 50,000 PYG discount
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 75,
    maxRedemptionsPerUser: 2,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: '₲50.000 descuento tratamiento capilar',
        en: '₲50,000 off hair treatment',
        gn: '₲50.000 jepi ñe'ẽ po ñembohapy rehe',
      },
      description: {
        es: 'Descuento fijo de ₲50.000 en cualquier tratamiento capilar profesional',
        en: 'Fixed ₲50,000 discount on any professional hair treatment',
        gn: '₲50.000 jepi fijo oimeraẽ ñe'ẽ po ñembohapy profesional-pe',
      },
      terms: {
        es: 'Válido en tratamientos de keratina, botox capilar y alisado.',
        en: 'Valid for keratin, hair botox and straightening treatments.',
        gn: 'Oikovante keratina, ñe'ẽ po botox ha alisado ñembohapy-pe.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-beauty-4'),
    businessId: FIXED_DEV_ENTITIES.businesses.beauty,
    categoryId: FIXED_DEV_ENTITIES.categories.beauty,
    titleKey: 'dev.voucher.beauty.manicure-pedicure.title',
    descriptionKey: 'dev.voucher.beauty.manicure-pedicure.description',
    termsAndConditionsKey: 'dev.voucher.beauty.manicure-pedicure.terms',
    type: 'percentage' as const,
    discount: 15,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 150,
    maxRedemptionsPerUser: 3,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Combo Manicura + Pedicura 15% OFF',
        en: 'Manicure + Pedicure Combo 15% OFF',
        gn: 'Combo Manicura + Pedicura 15% JEPI',
      },
      description: {
        es: '15% de descuento en combo manicura y pedicura con esmaltado semipermanente',
        en: '15% discount on manicure and pedicure combo with semi-permanent polish',
        gn: '15% jepi combo manicura ha pedicura esmalte semipermanente ndive',
      },
      terms: {
        es: 'Incluye limado, cutícula y esmaltado. Diseños adicionales se cobran aparte.',
        en: 'Includes filing, cuticle and polish. Additional designs charged separately.',
        gn: 'Oike limado, cutícula ha esmaltado. Diseño joaju oñekobrapa ambuépe.',
      },
    },
  },
  {
    id: generateFixedUUID('dev-voucher-beauty-5'),
    businessId: FIXED_DEV_ENTITIES.businesses.beauty,
    categoryId: FIXED_DEV_ENTITIES.categories.beauty,
    titleKey: 'dev.voucher.beauty.facial-anti-aging.title',
    descriptionKey: 'dev.voucher.beauty.facial-anti-aging.description',
    termsAndConditionsKey: 'dev.voucher.beauty.facial-anti-aging.terms',
    type: 'percentage' as const,
    discount: 25,
    currency: 'PYG',
    state: 'published' as const,
    maxRedemptions: 40,
    maxRedemptionsPerUser: 1,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    translations: {
      title: {
        es: 'Facial Anti-Edad Premium 25% OFF',
        en: 'Premium Anti-Aging Facial 25% OFF',
        gn: 'Facial Anti-Edad Premium 25% JEPI',
      },
      description: {
        es: 'Tratamiento facial anti-edad con tecnología avanzada y productos premium',
        en: 'Anti-aging facial treatment with advanced technology and premium products',
        gn: 'Facial ñembohapy anti-edad tecnología avanzada ha producto premium ndive',
      },
      terms: {
        es: 'Solo mayores de 35 años. Incluye consulta previa con especialista.',
        en: 'Ages 35+ only. Includes prior consultation with specialist.',
        gn: '35 ary guive año. Oike consulta mboyve especialista ndive.',
      },
    },
  },
] as const

export async function seedFixedDevData(prisma: PrismaClient): Promise<void> {
  console.log('🚀 Seeding fixed development data...')

  try {
    // 1. Create dev user
    console.log('👤 Creating dev business owner...')
    await prisma.user.upsert({
      where: { id: DEV_USER.id },
      update: DEV_USER,
      create: DEV_USER,
    })
    console.log(`✅ User created: ${DEV_USER.email}`)

    // 2. Create dev categories with translations
    console.log('🏷️ Creating dev categories...')
    for (const categoryData of DEV_CATEGORIES) {
      const { id, nameKey, descriptionKey, icon, slug, sortOrder, translations } = categoryData

      // Create category
      await prisma.category.upsert({
        where: { id },
        update: {
          nameKey,
          descriptionKey,
          icon,
          sortOrder,
          isActive: true,
        },
        create: {
          id,
          nameKey,
          descriptionKey,
          icon,
          sortOrder,
          isActive: true,
          level: 1,
          path: '',
          slug,
          createdBy: DEV_USER.id,
        },
      })

      // Create translations for name
      for (const [langCode, value] of Object.entries(translations.name)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: nameKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: nameKey,
            value,
            languageCode: langCode,
          },
        })
      }

      // Create translations for description
      for (const [langCode, value] of Object.entries(translations.description)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: descriptionKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: descriptionKey,
            value,
            languageCode: langCode,
          },
        })
      }

      console.log(`✅ Category created: ${translations.name.en}`)
    }

    // 3. Create dev businesses with translations
    console.log('🏢 Creating dev businesses...')
    for (const businessData of DEV_BUSINESSES) {
      const { translations, ...business } = businessData

      // Create business
      await prisma.business.upsert({
        where: { id: business.id },
        update: business,
        create: business,
      })

      // Create translations for business name
      for (const [langCode, value] of Object.entries(translations.name)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: business.businessNameKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: business.businessNameKey,
            value,
            languageCode: langCode,
          },
        })
      }

      // Create translations for business description
      for (const [langCode, value] of Object.entries(translations.description)) {
        await prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: business.businessDescriptionKey,
              languageCode: langCode,
            },
          },
          update: { value },
          create: {
            key: business.businessDescriptionKey,
            value,
            languageCode: langCode,
          },
        })
      }

      console.log(`✅ Business created: ${translations.name.en}`)
    }

    // 4. Create dev vouchers with translations
    console.log('🎫 Creating dev vouchers...')
    for (const voucherData of DEV_VOUCHERS) {
      const { translations, ...voucher } = voucherData

      // Create voucher
      await prisma.voucher.upsert({
        where: { id: voucher.id },
        update: voucher,
        create: voucher,
      })

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
      }

      console.log(`✅ Voucher created: ${translations.title.en}`)
    }

    console.log('✅ Fixed development data seeded successfully!')
    console.log(`
📋 Summary:
=============
👤 User: ${DEV_USER.email} (${DEV_USER.role})
🏢 Businesses: ${DEV_BUSINESSES.length} (${DEV_BUSINESSES.map(b => b.translations.name.en).join(', ')})
🏷️ Categories: ${DEV_CATEGORIES.length} categories
🎫 Vouchers: ${DEV_VOUCHERS.length} vouchers (5 per business)
🌍 Languages: ES, EN, GN translations for all content

🔧 All entities use fixed UUIDs for precise cleanup
    `)
  } catch (error) {
    console.error('❌ Failed to seed fixed development data:', error)
    throw error
  }
}

export async function cleanupFixedDevData(prisma: PrismaClient): Promise<void> {
  console.log('🧹 Cleaning up fixed development data...')

  try {
    // Clean up in reverse dependency order
    
    // 1. Delete voucher translations
    console.log('🗑️ Deleting voucher translations...')
    const voucherKeys = DEV_VOUCHERS.flatMap(v => [v.titleKey, v.descriptionKey, v.termsAndConditionsKey])
    await prisma.translation.deleteMany({
      where: { key: { in: voucherKeys } },
    })

    // 2. Delete vouchers
    console.log('🗑️ Deleting vouchers...')
    const voucherIds = DEV_VOUCHERS.map(v => v.id)
    await prisma.voucher.deleteMany({
      where: { id: { in: voucherIds } },
    })

    // 3. Delete business translations
    console.log('🗑️ Deleting business translations...')
    const businessKeys = DEV_BUSINESSES.flatMap(b => [b.businessNameKey, b.businessDescriptionKey])
    await prisma.translation.deleteMany({
      where: { key: { in: businessKeys } },
    })

    // 4. Delete businesses
    console.log('🗑️ Deleting businesses...')
    const businessIds = Object.values(FIXED_DEV_ENTITIES.businesses)
    await prisma.business.deleteMany({
      where: { id: { in: businessIds } },
    })

    // 5. Delete category translations
    console.log('🗑️ Deleting category translations...')
    const categoryKeys = DEV_CATEGORIES.flatMap(c => [c.nameKey, c.descriptionKey])
    await prisma.translation.deleteMany({
      where: { key: { in: categoryKeys } },
    })

    // 6. Delete categories
    console.log('🗑️ Deleting categories...')
    const categoryIds = Object.values(FIXED_DEV_ENTITIES.categories)
    await prisma.category.deleteMany({
      where: { id: { in: categoryIds } },
    })

    // 7. Delete user (this will cascade to related entities)
    console.log('🗑️ Deleting user...')
    await prisma.user.delete({
      where: { id: FIXED_DEV_ENTITIES.user },
    })

    console.log('✅ Fixed development data cleaned up successfully!')
  } catch (error) {
    console.error('❌ Failed to cleanup fixed development data:', error)
    throw error
  }
}