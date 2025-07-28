#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { UserRole, UserStatus } from '@pika/types'

const prisma = new PrismaClient()

// Admin user credentials
const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'User',
  phoneNumber: '+15551234567',
}

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_USER.email }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return existingAdmin
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_USER.email,
        password: hashedPassword,
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        phoneNumber: ADMIN_USER.phoneNumber,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        phoneVerified: true,
      }
    })

    console.log('✅ Admin user created successfully')
    console.log(`Email: ${admin.email}`)
    console.log(`Password: ${ADMIN_USER.password}`)
    console.log(`ID: ${admin.id}`)

    return admin
  } catch (error) {
    console.error('❌ Failed to create admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { createAdminUser, ADMIN_USER }