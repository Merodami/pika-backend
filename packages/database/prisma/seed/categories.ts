import type { PrismaClient } from '@prisma/client'

const FAKE_CATEGORIES = [
  // Food & Restaurants
  {
    nameKey: 'category.restaurant',
    descriptionKey: 'category.restaurant.description',
    icon: 'restaurant',
    sortOrder: 1,
    translations: {
      nameKey: {
        en: 'Restaurants',
        es: 'Restaurantes',
        gn: "Tembi'u renda",
      },
      descriptionKey: {
        en: 'Dining establishments and food services',
        es: 'Establecimientos de comida y servicios gastronómicos',
        gn: "Tembi'u renda ha mba'éichapa ojeporavo",
      },
    },
  },
  {
    nameKey: 'category.fastfood',
    descriptionKey: 'category.fastfood.description',
    icon: 'fastfood',
    sortOrder: 2,
    translations: {
      nameKey: {
        en: 'Fast Food',
        es: 'Comida Rápida',
        gn: "Tembi'u pya'e",
      },
      descriptionKey: {
        en: 'Quick service restaurants and takeaway',
        es: 'Restaurantes de servicio rápido y comida para llevar',
        gn: "Tembi'u pya'e ha ojegueraha",
      },
    },
  },
  {
    nameKey: 'category.cafe',
    descriptionKey: 'category.cafe.description',
    icon: 'coffee',
    sortOrder: 3,
    translations: {
      nameKey: {
        en: 'Cafés & Bakeries',
        es: 'Cafeterías y Panaderías',
        gn: 'Kafé ha mbujape renda',
      },
      descriptionKey: {
        en: 'Coffee shops, bakeries, and pastry stores',
        es: 'Cafeterías, panaderías y pastelerías',
        gn: 'Kafé renda, mbujape renda ha dulce renda',
      },
    },
  },

  // Shopping & Retail
  {
    nameKey: 'category.clothing',
    descriptionKey: 'category.clothing.description',
    icon: 'checkroom',
    sortOrder: 4,
    translations: {
      nameKey: {
        en: 'Clothing & Fashion',
        es: 'Ropa y Moda',
        gn: "Ao ha mba'éichapa ojejapo",
      },
      descriptionKey: {
        en: 'Clothing stores, fashion boutiques, and accessories',
        es: 'Tiendas de ropa, boutiques de moda y accesorios',
        gn: "Ao ñemuhenda, moda renda ha mba'e jeporu",
      },
    },
  },
  {
    nameKey: 'category.electronics',
    descriptionKey: 'category.electronics.description',
    icon: 'devices',
    sortOrder: 5,
    translations: {
      nameKey: {
        en: 'Electronics',
        es: 'Electrónicos',
        gn: "Mba'e elektróniko",
      },
      descriptionKey: {
        en: 'Electronic devices, gadgets, and technology stores',
        es: 'Dispositivos electrónicos, gadgets y tiendas de tecnología',
        gn: "Mba'e elektróniko, tecnología renda",
      },
    },
  },
  {
    nameKey: 'category.supermarket',
    descriptionKey: 'category.supermarket.description',
    icon: 'local_grocery_store',
    sortOrder: 6,
    translations: {
      nameKey: {
        en: 'Supermarkets',
        es: 'Supermercados',
        gn: 'Supermercado kuéra',
      },
      descriptionKey: {
        en: 'Grocery stores and supermarkets',
        es: 'Tiendas de comestibles y supermercados',
        gn: "Tembi'u ñemuhenda ha supermercado",
      },
    },
  },

  // Services
  {
    nameKey: 'category.beauty',
    descriptionKey: 'category.beauty.description',
    icon: 'face',
    sortOrder: 7,
    translations: {
      nameKey: {
        en: 'Beauty & Wellness',
        es: 'Belleza y Bienestar',
        gn: 'Iporã ha resapy',
      },
      descriptionKey: {
        en: 'Salons, spas, and wellness services',
        es: 'Salones, spas y servicios de bienestar',
        gn: 'Salon, spa ha resapy mbohapy',
      },
    },
  },
  {
    nameKey: 'category.automotive',
    descriptionKey: 'category.automotive.description',
    icon: 'directions_car',
    sortOrder: 8,
    translations: {
      nameKey: {
        en: 'Automotive',
        es: 'Automotriz',
        gn: 'Moto ha auto',
      },
      descriptionKey: {
        en: 'Car services, repairs, and automotive shops',
        es: 'Servicios de autos, reparaciones y talleres',
        gn: 'Auto mbohapy, nemyatyro ha taller',
      },
    },
  },
  {
    nameKey: 'category.healthcare',
    descriptionKey: 'category.healthcare.description',
    icon: 'local_hospital',
    sortOrder: 9,
    translations: {
      nameKey: {
        en: 'Healthcare',
        es: 'Salud',
        gn: 'Resapy',
      },
      descriptionKey: {
        en: 'Medical services, clinics, and pharmacies',
        es: 'Servicios médicos, clínicas y farmacias',
        gn: 'Pohã mbohapy, klinika ha farmacia',
      },
    },
  },

  // Entertainment & Leisure
  {
    nameKey: 'category.entertainment',
    descriptionKey: 'category.entertainment.description',
    icon: 'movie',
    sortOrder: 10,
    translations: {
      nameKey: {
        en: 'Entertainment',
        es: 'Entretenimiento',
        gn: "Vy'a",
      },
      descriptionKey: {
        en: 'Movies, theaters, and entertainment venues',
        es: 'Cines, teatros y lugares de entretenimiento',
        gn: "Ta'anga jehecha, teatro ha vy'a renda",
      },
    },
  },
  {
    nameKey: 'category.fitness',
    descriptionKey: 'category.fitness.description',
    icon: 'fitness_center',
    sortOrder: 11,
    translations: {
      nameKey: {
        en: 'Fitness & Sports',
        es: 'Fitness y Deportes',
        gn: 'Ejercicio ha nembosarai',
      },
      descriptionKey: {
        en: 'Gyms, sports clubs, and fitness centers',
        es: 'Gimnasios, clubes deportivos y centros de fitness',
        gn: 'Gimnasio, nembosarai club ha ejercicio renda',
      },
    },
  },
  {
    nameKey: 'category.travel',
    descriptionKey: 'category.travel.description',
    icon: 'flight',
    sortOrder: 12,
    translations: {
      nameKey: {
        en: 'Travel & Tourism',
        es: 'Viajes y Turismo',
        gn: 'Jeho ha turismo',
      },
      descriptionKey: {
        en: 'Hotels, travel agencies, and tourism services',
        es: 'Hoteles, agencias de viaje y servicios turísticos',
        gn: 'Hotel, jeho agencia ha turismo mbohapy',
      },
    },
  },

  // Professional Services
  {
    nameKey: 'category.education',
    descriptionKey: 'category.education.description',
    icon: 'school',
    sortOrder: 13,
    translations: {
      nameKey: {
        en: 'Education',
        es: 'Educación',
        gn: 'Mboesapy',
      },
      descriptionKey: {
        en: 'Schools, courses, and educational services',
        es: 'Escuelas, cursos y servicios educativos',
        gn: 'Mboehao, kurso ha mboesapy mbohapy',
      },
    },
  },
  {
    nameKey: 'category.finance',
    descriptionKey: 'category.finance.description',
    icon: 'account_balance',
    sortOrder: 14,
    translations: {
      nameKey: {
        en: 'Financial Services',
        es: 'Servicios Financieros',
        gn: 'Pirapire mbohapy',
      },
      descriptionKey: {
        en: 'Banks, insurance, and financial institutions',
        es: 'Bancos, seguros e instituciones financieras',
        gn: 'Banco, seguro ha pirapire institución',
      },
    },
  },
  {
    nameKey: 'category.realestate',
    descriptionKey: 'category.realestate.description',
    icon: 'home',
    sortOrder: 15,
    translations: {
      nameKey: {
        en: 'Real Estate',
        es: 'Bienes Raíces',
        gn: 'Oga nemuhenda',
      },
      descriptionKey: {
        en: 'Property sales, rentals, and real estate services',
        es: 'Venta de propiedades, alquileres y servicios inmobiliarios',
        gn: 'Oga nemuhenda, alquiler ha inmobiliaria mbohapy',
      },
    },
  },
] as const

export async function seedCategories(prisma: PrismaClient): Promise<void> {
  console.log('🏷️ Seeding categories...')

  for (const categoryData of FAKE_CATEGORIES) {
    const { nameKey, descriptionKey, icon, sortOrder, translations } = categoryData

    // Create category using slug as unique identifier
    const slug = nameKey.replace('category.', '')
    const category = await prisma.category.upsert({
      where: { slug },
      update: {
        nameKey,
        descriptionKey,
        icon,
        sortOrder,
        isActive: true,
      },
      create: {
        nameKey,
        descriptionKey,
        icon,
        sortOrder,
        isActive: true,
        level: 1,
        path: '',
        slug,
        createdBy: '00000000-0000-0000-0000-000000000000', // System/seed user placeholder
      },
    })

    // Create translations for name
    for (const [langCode, value] of Object.entries(translations.nameKey)) {
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
    for (const [langCode, value] of Object.entries(translations.descriptionKey)) {
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

    console.log(`✅ Category seeded: ${translations.nameKey.en}`)
  }

  console.log('✅ All categories seeded successfully')
}