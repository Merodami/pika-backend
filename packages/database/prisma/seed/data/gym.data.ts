/**
 * Gym seed data and utilities
 */

import { faker } from '@faker-js/faker'
import { GymStatus, GymTier,GymVerificationStatus, StuffType } from '@prisma/client'

export const GYM_NAMES = [
  'FitLife Gym',
  'PowerHouse Fitness',
  'Iron Temple',
  'Elite Performance Center',
  'CrossFit Box',
  'Strength & Conditioning Hub',
  'The Fitness Factory',
  'Peak Performance Gym',
  'Urban Fitness Studio',
  'Muscle Beach Gym',
  'Anytime Fitness',
  'Pure Gym',
  'Gold\'s Gym',
  'LA Fitness',
  'Equinox',
]

export const GYM_EQUIPMENT: Array<{ name: string; icon: string; type: StuffType }> = [
  { name: 'Treadmill', icon: '🏃', type: StuffType.EQUIPMENT },
  { name: 'Elliptical Machine', icon: '🚴', type: StuffType.EQUIPMENT },
  { name: 'Rowing Machine', icon: '🚣', type: StuffType.EQUIPMENT },
  { name: 'Stationary Bike', icon: '🚲', type: StuffType.EQUIPMENT },
  { name: 'Smith Machine', icon: '🏋️', type: StuffType.EQUIPMENT },
  { name: 'Cable Machine', icon: '💪', type: StuffType.EQUIPMENT },
  { name: 'Leg Press Machine', icon: '🦵', type: StuffType.EQUIPMENT },
  { name: 'Chest Press Machine', icon: '💪', type: StuffType.EQUIPMENT },
  { name: 'Lat Pulldown Machine', icon: '💪', type: StuffType.EQUIPMENT },
  { name: 'Dumbbells (5-100 lbs)', icon: '🏋️', type: StuffType.EQUIPMENT },
  { name: 'Barbells', icon: '🏋️', type: StuffType.EQUIPMENT },
  { name: 'Kettlebells', icon: '🏋️', type: StuffType.EQUIPMENT },
  { name: 'Medicine Balls', icon: '⚽', type: StuffType.EQUIPMENT },
  { name: 'TRX Suspension Trainer', icon: '🔗', type: StuffType.EQUIPMENT },
  { name: 'Battle Ropes', icon: '🪢', type: StuffType.EQUIPMENT },
]

export const GYM_AMENITIES: Array<{ name: string; icon: string; type: StuffType }> = [
  { name: 'Locker Rooms', icon: '🚪', type: StuffType.AMENITY },
  { name: 'Showers', icon: '🚿', type: StuffType.AMENITY },
  { name: 'Sauna', icon: '🧖', type: StuffType.AMENITY },
  { name: 'Steam Room', icon: '♨️', type: StuffType.AMENITY },
  { name: 'Parking', icon: '🚗', type: StuffType.AMENITY },
  { name: 'Towel Service', icon: '🏖️', type: StuffType.AMENITY },
  { name: 'Juice Bar', icon: '🥤', type: StuffType.AMENITY },
  { name: 'WiFi', icon: '📶', type: StuffType.AMENITY },
  { name: 'Air Conditioning', icon: '❄️', type: StuffType.AMENITY },
  { name: 'Water Fountain', icon: '💧', type: StuffType.AMENITY },
]

export const GYM_FEATURES: Array<{ name: string; icon: string; type: StuffType }> = [
  { name: 'Personal Training', icon: '👨‍🏫', type: StuffType.FEATURE },
  { name: 'Group Classes', icon: '👥', type: StuffType.FEATURE },
  { name: 'Yoga Studio', icon: '🧘', type: StuffType.FEATURE },
  { name: 'Spin Studio', icon: '🚴', type: StuffType.FEATURE },
  { name: 'Boxing Ring', icon: '🥊', type: StuffType.FEATURE },
  { name: 'Swimming Pool', icon: '🏊', type: StuffType.FEATURE },
  { name: 'Basketball Court', icon: '🏀', type: StuffType.FEATURE },
  { name: 'Functional Training Area', icon: '🏋️', type: StuffType.FEATURE },
  { name: 'Olympic Lifting Platform', icon: '🏋️', type: StuffType.FEATURE },
  { name: 'Stretching Area', icon: '🤸', type: StuffType.FEATURE },
]

export function generateGymData(index: number) {
  const name = GYM_NAMES.at(index) ?? `${faker.company.name()} Fitness`

  const address = faker.location.streetAddress()
  const city = faker.location.city()
  const state = faker.location.state()
  const postalCode = faker.location.zipCode()
  const country = 'UK'

  return {
    name,
    description: faker.lorem.paragraph(),
    address: `${address}, ${city}, ${state} ${postalCode}`,

    // Operating hours as string (JSON format expected)
    openingHours: JSON.stringify({
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '07:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' },
    }),

    // Location details
    city,
    state,
    country,
    postalCode,
    latitude: parseFloat(faker.location.latitude()),
    longitude: parseFloat(faker.location.longitude()),

    // Contact
    phoneNumber: faker.phone.number(),
    email: faker.internet.email({ firstName: name.toLowerCase().replace(/\s+/g, '.') }),
    website: faker.internet.url(),

    // Physical details
    area: faker.number.int({ min: 1000, max: 10000 }),
    capacity: faker.number.int({ min: 50, max: 500 }),

    // Pricing
    priceRange: faker.helpers.arrayElement(['$', '$$', '$$$', '$$$$']),

    // Images
    pictures: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => faker.image.url()),

    // Rules and transport
    houseRules: faker.lorem.paragraph(),
    publicTransport: faker.helpers.arrayElement([
      'Bus stop 2 min walk',
      'Metro station 5 min walk',
      'Train station nearby',
      'Multiple bus routes available',
    ]),
    parking: faker.helpers.arrayElement([
      'Free parking available',
      'Street parking only',
      'Paid parking garage',
      'Limited parking spaces',
    ]),

    // Partnership
    isPartner: faker.datatype.boolean(0.7),
    partner: faker.datatype.boolean(0.3) ? faker.company.name() : null,

    // Status
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: GymStatus.ACTIVE },
      { weight: 10, value: GymStatus.INACTIVE },
      { weight: 10, value: GymStatus.MAINTENANCE },
      { weight: 10, value: GymStatus.COMING_SOON },
    ]),
    isActive: true,

    // Verification
    verificationStatus: faker.helpers.weightedArrayElement([
      { weight: 60, value: GymVerificationStatus.APPROVED },
      { weight: 20, value: GymVerificationStatus.PENDING },
      { weight: 10, value: GymVerificationStatus.UNDER_REVIEW },
      { weight: 5, value: GymVerificationStatus.REJECTED },
      { weight: 5, value: GymVerificationStatus.SUSPENDED },
    ]),
    verifiedAt: faker.datatype.boolean(0.6) ? faker.date.recent({ days: 90 }) : null,
    rejectionReason: faker.datatype.boolean(0.1) ? faker.lorem.sentence() : null,

    // Business
    businessRegistrationNumber: faker.datatype.boolean(0.8)
      ? faker.string.alphanumeric(10).toUpperCase()
      : null,
    taxId: faker.datatype.boolean(0.8)
      ? faker.string.alphanumeric(12).toUpperCase()
      : null,
    bankAccountVerified: faker.datatype.boolean(0.7),

    // Subscription
    tier: faker.helpers.weightedArrayElement([
      { weight: 30, value: GymTier.BASIC },
      { weight: 40, value: GymTier.STANDARD },
      { weight: 20, value: GymTier.PREMIUM },
      { weight: 10, value: GymTier.ENTERPRISE },
    ]),

    // Features and amenities as arrays
    features: faker.helpers.arrayElements([
      'Personal Training',
      'Group Classes',
      'Yoga Studio',
      'Spin Classes',
      'Swimming Pool',
      'Sauna',
      'Steam Room',
      'Juice Bar',
    ], { min: 3, max: 8 }),
    amenities: faker.helpers.arrayElements([
      'Free Parking',
      'Locker Rooms',
      'Showers',
      'Towel Service',
      'WiFi',
      'Air Conditioning',
      'Water Fountains',
      'Changing Rooms',
    ], { min: 4, max: 8 }),

    // Admin
    adminNotes: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
    riskScore: faker.datatype.boolean(0.1) ? faker.number.int({ min: 1, max: 100 }) : null,
    lastInspectionDate: faker.datatype.boolean(0.5) ? faker.date.recent({ days: 180 }) : null,
  }
}

export function generateGymReview() {
  const rating = faker.number.int({ min: 1, max: 5 })

  return {
    rating,
    comment: faker.datatype.boolean(0.8) ? faker.lorem.paragraph() : null,
  }
}