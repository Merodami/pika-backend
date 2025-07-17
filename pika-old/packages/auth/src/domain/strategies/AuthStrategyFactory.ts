import { ErrorFactory } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { AuthenticationStrategy } from './AuthenticationStrategy.js'
import { FacebookAuthStrategy } from './FacebookAuthStrategy.js'
import { GoogleAuthStrategy } from './GoogleAuthStrategy.js'

export interface AuthStrategyFactory {
  getStrategy(provider: string): AuthenticationStrategy
  getSupportedProviders(): string[]
}

export class AuthStrategyFactoryImpl implements AuthStrategyFactory {
  private strategies: Map<string, AuthenticationStrategy>

  constructor(prisma: PrismaClient) {
    this.strategies = new Map()

    // Initialize strategies
    const googleStrategy = new GoogleAuthStrategy(prisma)
    const facebookStrategy = new FacebookAuthStrategy(prisma)

    this.strategies.set(googleStrategy.provider, googleStrategy)
    this.strategies.set(facebookStrategy.provider, facebookStrategy)
  }

  getStrategy(provider: string): AuthenticationStrategy {
    const strategy = this.strategies.get(provider.toLowerCase())

    if (!strategy) {
      throw ErrorFactory.validationError(
        { provider: [`Provider '${provider}' is not supported`] },
        { source: 'AuthStrategyFactory.getStrategy' },
      )
    }

    return strategy
  }

  getSupportedProviders(): string[] {
    return Array.from(this.strategies.keys())
  }
}
