// Core authentication services
export type {
  AuthTokens,
  TokenValidationResult,
} from './services/JwtTokenService.js'
export type {
  TokenPayload as JwtTokenPayload,
  User as JwtUser,
} from './services/JwtTokenService.js'
export { JwtTokenService } from './services/JwtTokenService.js'
export * from './services/PasswordSecurityService.js'
export {
  createRS256JwtTokenService,
  RS256JwtTokenService,
} from './services/RS256JwtTokenService.js'

// Authentication strategies
export * from './strategies/AuthStrategy.js'
export * from './strategies/AuthStrategyFactory.js'
export * from './strategies/LocalAuthStrategy.js'

// Application layer - Use cases
export * from './application/use_cases/LoginUseCase.js'
export * from './application/use_cases/LogoutUseCase.js'
export * from './application/use_cases/RefreshTokenUseCase.js'
export * from './application/use_cases/RegisterUseCase.js'
export * from './application/use_cases/TokenExchangeUseCase.js'

// API layer - Controllers and routes
export * from './api/controllers/AuthController.js'
export * from './api/routes/authRoutes.js'

// Adapters
export * from './adapters/UserServiceAdapter.js'

// Domain
export * from './domain/interfaces/IdentityProvider.js'

// Infrastructure
export { IdentityProviderRegistry } from './infrastructure/IdentityProviderRegistry.js'
export {
  CognitoIdentityProvider,
  CognitoIdentityProviderFactory,
} from './infrastructure/providers/CognitoIdentityProvider.js'

// Config
export * from './config/AuthServiceConfig.js'
export {
  initializeIdentityProviders,
  loadIdentityProviderConfigs,
} from './config/identityProviderConfig.js'

// Utils
export { getJwtVerifier } from './utils/jwtVerifier.js'
export { createOrLinkUser } from './utils/userManagement.js'

// Middleware
export { default as userContextPlugin } from './middleware/userContext.js'
export {
  getLocalUserProfileByCognitoId,
  getLocalUserProfileByIdentity,
  mapRolesToPermissions,
} from './middleware/userContext.js'
