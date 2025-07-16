import { createAuthServer } from '@pika/auth-service'
import { createCommunicationServer } from '@pikanication'
import { createPaymentServer } from '@pikant'
import { createStorageServer } from '@pikage'
import { createSubscriptionServer } from '@pikaription'
import { createSupportServer } from '@pikart'
import { createUserServer } from '@pika

import type { ServiceDefinition, ServiceDependencies } from '../types/index.js'

export function getServiceDefinitions(): ServiceDefinition[] {
  return [
    {
      name: 'auth',
      port: 5501,
      basePath: '/auth',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createAuthServer({
          port: 5501,
          cacheService: deps.cache,
          userServiceClient: deps.services?.user,
          communicationClient: deps.services?.communication,
        })

        return app
      },
    },
    {
      name: 'user',
      port: 5502,
      basePath: '/users',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createUserServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
          fileStorage: deps.services?.fileStorage,
          communicationClient: deps.services?.communication,
        })

        return app
      },
    },
    {
      name: 'payment',
      port: 5505,
      basePath: '/payments',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const { app } = await createPaymentServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
        })

        return app
      },
    },
    {
      name: 'subscription',
      port: 5506,
      basePath: '/subscriptions',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const { app } = await createSubscriptionServer({
          prisma: deps.prisma,
          cacheService: deps.cache,
          paymentClient: deps.services?.payment,
        })

        return app
      },
    },
    {
      name: 'communication',
      port: 5507,
      basePath: '/communications',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createCommunicationServer({
          port: 5507,
          prisma: deps.prisma,
          cacheService: deps.cache,
          emailConfig: {
            region: 'us-east-1',
            fromEmail: process.env.EMAIL_FROM || 'noreply@pika
            fromName: 'Pika',
          },
        })

        return app
      },
    },
    {
      name: 'support',
      port: 5509,
      basePath: '/support',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const { app } = await createSupportServer({
          port: 5509,
          prisma: deps.prisma,
          cacheService: deps.cache,
        })

        return app
      },
    },
    {
      name: 'storage',
      port: 5510,
      basePath: '/storage',
      healthCheck: '/health',
      createApp: async (deps: ServiceDependencies) => {
        const app = await createStorageServer({
          port: 5510,
          prisma: deps.prisma,
          cacheService: deps.cache,
          storageConfig: {
            region: process.env.STORAGE_REGION || 'us-east-1',
            bucketName: process.env.STORAGE_BUCKET || 'pika-storage',
            accessKeyId: process.env.STORAGE_ACCESS_KEY,
            secretAccessKey: process.env.STORAGE_SECRET_KEY,
            endpoint: process.env.STORAGE_ENDPOINT,
          },
        })

        return app
      },
    },
  ]
}
