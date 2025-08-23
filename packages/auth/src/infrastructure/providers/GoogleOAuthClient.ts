import axios from 'axios'
import { ErrorFactory, logger } from '@pika/shared'
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '@pika/environment'

/**
 * Google OAuth 2.0 Client
 * Handles authorization code exchange and token operations
 */
export class GoogleOAuthClient {
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token'
  private readonly userInfoEndpoint = 'https://www.googleapis.com/oauth2/v3/userinfo'
  private configWarningShown = false
  
  constructor(
    private readonly clientId: string = GOOGLE_CLIENT_ID || '',
    private readonly clientSecret: string = GOOGLE_CLIENT_SECRET || '',
  ) {
    // Don't warn on initialization, only when actually used
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{
    idToken: string
    accessToken: string
    refreshToken?: string
    expiresIn: number
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw ErrorFactory.serviceUnavailable(
        'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
      )
    }

    try {
      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      const { id_token, access_token, refresh_token, expires_in } = response.data

      if (!id_token) {
        throw ErrorFactory.badRequest('No ID token received from Google')
      }

      return {
        idToken: id_token,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in || 3600,
      }
    } catch (error: any) {
      logger.error('Google OAuth code exchange failed', {
        error: error.response?.data || error.message,
      })

      if (error.response?.status === 400) {
        throw ErrorFactory.badRequest(
          error.response?.data?.error_description || 'Invalid authorization code'
        )
      }

      throw ErrorFactory.serviceUnavailable(
        'Failed to exchange Google authorization code'
      )
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string
    email: string
    emailVerified: boolean
    name?: string
    givenName?: string
    familyName?: string
    picture?: string
    locale?: string
  }> {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return {
        id: response.data.sub,
        email: response.data.email,
        emailVerified: response.data.email_verified || false,
        name: response.data.name,
        givenName: response.data.given_name,
        familyName: response.data.family_name,
        picture: response.data.picture,
        locale: response.data.locale,
      }
    } catch (error: any) {
      logger.error('Failed to get Google user info', {
        error: error.response?.data || error.message,
      })

      throw ErrorFactory.serviceUnavailable('Failed to get Google user information')
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    expiresIn: number
    idToken?: string
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw ErrorFactory.serviceUnavailable('Google OAuth not configured')
    }

    try {
      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 3600,
        idToken: response.data.id_token,
      }
    } catch (error: any) {
      logger.error('Google token refresh failed', {
        error: error.response?.data || error.message,
      })

      throw ErrorFactory.unauthorized('Failed to refresh Google access token')
    }
  }

  /**
   * Revoke tokens
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await axios.post(
        'https://oauth2.googleapis.com/revoke',
        new URLSearchParams({ token }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
    } catch (error: any) {
      logger.error('Google token revocation failed', {
        error: error.response?.data || error.message,
      })
      // Don't throw error for revocation failures
    }
  }

  /**
   * Verify ID token (decode without verification for now)
   * In production, should verify signature with Google's public keys
   */
  decodeIdToken(idToken: string): any {
    try {
      // Split the JWT token
      const parts = idToken.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid ID token format')
      }

      // Decode the payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      )

      return payload
    } catch (error) {
      logger.error('Failed to decode Google ID token', error as Error)
      throw ErrorFactory.badRequest('Invalid Google ID token')
    }
  }
}

// Export singleton instance and class
export const googleOAuthClient = new GoogleOAuthClient()