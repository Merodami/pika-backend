import {
  LOCAL_AUTH_URL,
  NODE_ENV,
  USER_POOL_CLIENT_ID,
  USER_POOL_ID,
} from '@pika/environment'
import { logger } from '@pika/shared'

import { IdentityProviderOptions } from '../domain/interfaces/IdentityProvider.js'
import { IdentityProviderRegistry } from '../infrastructure/IdentityProviderRegistry.js'
import {
  CognitoIdentityProviderFactory,
  CognitoIdentityProviderOptions,
} from '../infrastructure/providers/CognitoIdentityProvider.js'

/**
 * Load identity provider configurations from environment variables
 */
export function loadIdentityProviderConfigs(): IdentityProviderOptions[] {
  const configs: IdentityProviderOptions[] = []
  const nodeEnv = NODE_ENV || 'development'

  // Configure Cognito provider
  const cognitoConfig: CognitoIdentityProviderOptions = {
    type: 'cognito',
    enabled: true,
    userPoolId: USER_POOL_ID,
    clientId: USER_POOL_CLIENT_ID,
    tokenUse: 'access',
  }

  // For local development, we use a local endpoint
  if (nodeEnv === 'development') {
    cognitoConfig.localDevelopmentUrl = LOCAL_AUTH_URL
  }

  // Additional providers would be configured here

  configs.push(cognitoConfig)

  return configs
}

/**
 * Initialize all identity providers and register them in the registry
 */
export async function initializeIdentityProviders(): Promise<void> {
  const registry = IdentityProviderRegistry.getInstance()

  // Register provider factories
  registry.registerFactory('cognito', new CognitoIdentityProviderFactory())

  // Add more factories here as they are implemented

  // Load configs and configure providers
  const configs = loadIdentityProviderConfigs()

  for (const config of configs) {
    if (config.enabled) {
      try {
        await registry.configureProvider(config)
        logger.info(`Successfully configured identity provider: ${config.type}`)
      } catch (error) {
        logger.error(
          `Failed to configure identity provider ${config.type}:`,
          error,
        )
      }
    }
  }
}
