// Core authentication services
export type {
  AuthTokens,
  TokenValidationResult,
} from './services/JwtTokenService.js'
export type {
  TokenPayload as JwtTokenPayload,
  User as JwtUser,
} from './services/JwtTokenService.js'
export {
  createJwtTokenService,
  JwtTokenService,
} from './services/JwtTokenService.js'
export * from './services/PasswordSecurityService.js'
// RS256JwtTokenService not implemented yet

// Authentication strategies
export * from './strategies/AuthStrategy.js'
export * from './strategies/AuthStrategyFactory.js'
export * from './strategies/LocalAuthStrategy.js'

// Application layer - Use cases
export * from './application/use_cases/LoginUseCase.js'
export * from './application/use_cases/LogoutUseCase.js'
export * from './application/use_cases/RefreshTokenUseCase.js'
export * from './application/use_cases/RegisterUseCase.js'

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
export {
  FacebookOAuthClient,
  facebookOAuthClient,
} from './infrastructure/providers/FacebookOAuthClient.js'
export {
  FirebaseIdentityProvider,
  FirebaseIdentityProviderFactory,
  getProviderFromToken,
  isSocialAuthToken,
} from './infrastructure/providers/FirebaseIdentityProvider.js'
export {
  GoogleOAuthClient,
  googleOAuthClient,
} from './infrastructure/providers/GoogleOAuthClient.js'
export {
  createFirebaseAuthStrategy,
  FirebaseAuthStrategy,
  type FirebaseCredentials,
} from './strategies/FirebaseAuthStrategy.js'

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
// userContext middleware not available in this version
