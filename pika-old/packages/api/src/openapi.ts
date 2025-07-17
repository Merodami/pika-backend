import './parameterRegistration.js'
import './schemaRegistration.js'

import { merge } from 'lodash-es'
import { OpenAPIV3 } from 'openapi-types'

import { ErrorResponses } from './responses/errors.js'
import { CampaignRoutes } from './routes/marketplace/campaign.js'
import { CategoryRoutes } from './routes/marketplace/category.js'
import { PDFRoutes } from './routes/marketplace/pdf.js'
import { ProviderRoutes } from './routes/marketplace/provider.js'
import { RedemptionRoutes } from './routes/marketplace/redemption.js'
import { ReviewRoutes } from './routes/marketplace/review.js'
import { VoucherRoutes } from './routes/marketplace/voucher.js'
import { MessagingRoutes } from './routes/messaging/messaging.js'
import { NotificationRoutes } from './routes/notification/notification.js'
import { PaymentRoutes } from './routes/payment/payment.js'
import { SystemRoutes } from './routes/system/index.js'
import { AuthRoutes, UserRoutes } from './routes/user/index.js'
import { registry } from './schemaRegistry.js'

/**
 * Combined OpenAPI Specification for Pika
 */
const baseSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Pika API',
    version: '1.0.0',
    description:
      'RESTful API for Pika, connecting local service providers with customers in Paraguay.',
    contact: {
      name: 'Pika Support',
      email: 'support@pika.help',
    },
  },
  servers: [
    {
      url: 'https://api.pika.help',
      description: 'Production server',
    },
    {
      url: 'https://staging.api.pika.help',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:9000',
      description: 'Local development server',
      variables: {
        environment: {
          default: 'development',
          enum: ['development', 'staging', 'production'],
          description: 'The environment specified in NODE_ENV',
        },
      },
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication operations',
    },
    {
      name: 'Users',
      description: 'User account management operations',
    },
    {
      name: 'Providers',
      description: 'Service provider operations',
    },
    {
      name: 'Categories',
      description: 'Service category operations',
    },
    {
      name: 'Campaigns',
      description: 'Marketing campaign operations',
    },
    {
      name: 'PDF',
      description: 'PDF voucher book operations',
    },
    {
      name: 'Vouchers',
      description: 'Voucher management operations',
    },
    {
      name: 'Redemptions',
      description: 'Voucher redemption operations',
    },
    {
      name: 'Reviews',
      description: 'Review and feedback operations',
    },
    {
      name: 'Payments',
      description: 'Payment processing operations',
    },
    {
      name: 'Messaging',
      description: 'Real-time messaging and conversation management',
    },
    {
      name: 'Notifications',
      description: 'Push notifications and user alerts',
    },
    {
      name: 'System',
      description:
        'System-level operations like health checks and documentation',
    },
  ],
  paths: {},
  components: {
    responses: {
      UnauthorizedError: ErrorResponses.UnauthorizedError,
      ForbiddenError: ErrorResponses.ForbiddenError,
      NotFoundError: ErrorResponses.NotFoundError,
      BadRequestError: ErrorResponses.BadRequestError,
      ConflictError: ErrorResponses.ConflictError,
      ValidationError: ErrorResponses.ValidationError,
      InternalServerError: ErrorResponses.InternalServerError,
      RateLimitError: ErrorResponses.RateLimitError,
      ServerError: ErrorResponses.ServerError,
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication for user access',
      },
    },
  },
}

// Merge all routes and schemas into the OpenAPI specification
export const OpenAPISpec: OpenAPIV3.Document = merge(
  {}, // Start with empty object to avoid mutating the base
  baseSpec,
  {
    paths: {
      // Marketplace routes
      ...(AuthRoutes.paths || {}),
      ...(UserRoutes.paths || {}),
      ...(ProviderRoutes.paths || {}),
      ...(CategoryRoutes.paths || {}),
      ...(CampaignRoutes.paths || {}),
      ...(PDFRoutes.paths || {}),
      ...(VoucherRoutes.paths || {}),
      ...(RedemptionRoutes.paths || {}),
      ...(ReviewRoutes.paths || {}),
      ...(PaymentRoutes.paths || {}),

      // Communication routes
      ...(MessagingRoutes.paths || {}),
      ...(NotificationRoutes.paths || {}),

      // System routes
      ...(SystemRoutes.paths || {}),
    },
    components: {
      schemas: {
        // Get schemas from registry
        ...registry.generateComponents().schemas,

        // Get any additional schemas from route files
        ...(AuthRoutes.components?.schemas || {}),
        ...(UserRoutes.components?.schemas || {}),
        ...(ProviderRoutes.components?.schemas || {}),
        ...(CategoryRoutes.components?.schemas || {}),
        ...(CampaignRoutes.components?.schemas || {}),
        ...(PDFRoutes.components?.schemas || {}),
        ...(VoucherRoutes.components?.schemas || {}),
        ...(RedemptionRoutes.components?.schemas || {}),
        ...(ReviewRoutes.components?.schemas || {}),
        ...(PaymentRoutes.components?.schemas || {}),
        ...(MessagingRoutes.components?.schemas || {}),
        ...(NotificationRoutes.components?.schemas || {}),
        ...(SystemRoutes.components?.schemas || {}),
      },
      parameters: {
        // Get parameters from registry
        ...registry.generateComponents().parameters,

        // Get any additional parameters from route files
        ...(AuthRoutes.components?.parameters || {}),
        ...(UserRoutes.components?.parameters || {}),
        ...(ProviderRoutes.components?.parameters || {}),
        ...(CategoryRoutes.components?.parameters || {}),
        ...(CampaignRoutes.components?.parameters || {}),
        ...(PDFRoutes.components?.parameters || {}),
        ...(VoucherRoutes.components?.parameters || {}),
        ...(RedemptionRoutes.components?.parameters || {}),
        ...(ReviewRoutes.components?.parameters || {}),
        ...(PaymentRoutes.components?.parameters || {}),
        ...(MessagingRoutes.components?.parameters || {}),
        ...(NotificationRoutes.components?.parameters || {}),
        ...(SystemRoutes.components?.parameters || {}),
      },
    },
  },
)

// Export a function to get the OpenAPI spec for documentation
// export function getOpenAPISpec(): OpenAPIV3.Document {
//   return OpenAPISpec
// }

// Export individual route collections for modular access
// export const MarketplaceRoutes = {
//   AuthRoutes,
//   UserRoutes,
//   ProviderRoutes,
//   CategoryRoutes,
//   ServiceRoutes,
//   ReviewRoutes,
//   PaymentRoutes
// }
