import { User } from '@prisma/client'

import { FirebaseUserClaims } from '../../infrastructure/firebase/FirebaseAuthService.js'

// Strategy pattern for authentication providers
export interface AuthenticationStrategy {
  readonly provider: string
  authenticate(
    claims: FirebaseUserClaims,
    deviceInfo: DeviceInfo,
  ): Promise<AuthenticationResult>
  linkAccount(userId: string, claims: FirebaseUserClaims): Promise<void>
  unlinkAccount(userId: string): Promise<void>
}

// Value objects
export interface DeviceInfo {
  deviceId: string
  deviceName?: string
  deviceType: 'ios' | 'android' | 'web' | 'desktop'
  fcmToken?: string
  ipAddress?: string
  userAgent?: string
  location?: {
    lat: number
    lng: number
    city?: string
    country?: string
  }
}

export interface AuthenticationResult {
  user: User
  isNewUser: boolean
  requiresAdditionalInfo: boolean
  requiresMfa: boolean
  authMethod: string
  firebaseUid: string
  provider: string
  providerData: Record<string, any>
}
