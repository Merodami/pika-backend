import axios from 'axios'
import { ErrorFactory, logger } from '@pika/shared'
import {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
} from '@pika/environment'

/**
 * Facebook OAuth 2.0 Client
 * Handles authorization code exchange and Graph API operations
 */
export class FacebookOAuthClient {
  private readonly tokenEndpoint = 'https://graph.facebook.com/v18.0/oauth/access_token'
  private readonly debugTokenEndpoint = 'https://graph.facebook.com/debug_token'
  private readonly userInfoEndpoint = 'https://graph.facebook.com/v18.0/me'
  
  constructor(
    private readonly appId: string = FACEBOOK_APP_ID || '',
    private readonly appSecret: string = FACEBOOK_APP_SECRET || '',
  ) {
    if (!this.appId || !this.appSecret) {
      logger.warn('Facebook OAuth client not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET')
    }
  }

  /**
   * Exchange authorization code for tokens
   * Facebook doesn't return ID tokens directly, we need to get user info separately
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string
    expiresIn: number
    tokenType: string
  }> {
    if (!this.appId || !this.appSecret) {
      throw ErrorFactory.serviceUnavailable(
        'Facebook OAuth not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.'
      )
    }

    try {
      const response = await axios.get(this.tokenEndpoint, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: redirectUri,
          code,
        },
      })

      const { access_token, expires_in, token_type } = response.data

      if (!access_token) {
        throw ErrorFactory.badRequest('No access token received from Facebook')
      }

      return {
        accessToken: access_token,
        expiresIn: expires_in || 5183999, // Facebook default is ~60 days
        tokenType: token_type || 'bearer',
      }
    } catch (error: any) {
      logger.error('Facebook OAuth code exchange failed', {
        error: error.response?.data || error.message,
      })

      if (error.response?.status === 400) {
        const errorData = error.response?.data?.error
        throw ErrorFactory.badRequest(
          errorData?.message || 'Invalid authorization code'
        )
      }

      throw ErrorFactory.serviceUnavailable(
        'Failed to exchange Facebook authorization code'
      )
    }
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string
    email?: string
    name?: string
    firstName?: string
    lastName?: string
    picture?: string
    emailVerified?: boolean
  }> {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        params: {
          access_token: accessToken,
          fields: 'id,email,name,first_name,last_name,picture.width(200).height(200)',
        },
      })

      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        picture: response.data.picture?.data?.url,
        emailVerified: !!response.data.email, // Facebook doesn't provide explicit verification status
      }
    } catch (error: any) {
      logger.error('Failed to get Facebook user info', {
        error: error.response?.data || error.message,
      })

      throw ErrorFactory.serviceUnavailable('Failed to get Facebook user information')
    }
  }

  /**
   * Debug/Inspect an access token
   * Useful for validating tokens and getting metadata
   */
  async debugToken(accessToken: string): Promise<{
    isValid: boolean
    userId?: string
    appId?: string
    expiresAt?: number
    scopes?: string[]
  }> {
    if (!this.appId || !this.appSecret) {
      throw ErrorFactory.serviceUnavailable('Facebook OAuth not configured')
    }

    try {
      const response = await axios.get(this.debugTokenEndpoint, {
        params: {
          input_token: accessToken,
          access_token: `${this.appId}|${this.appSecret}`, // App access token
        },
      })

      const { data } = response.data

      return {
        isValid: data.is_valid,
        userId: data.user_id,
        appId: data.app_id,
        expiresAt: data.expires_at,
        scopes: data.scopes,
      }
    } catch (error: any) {
      logger.error('Facebook token debug failed', {
        error: error.response?.data || error.message,
      })

      return { isValid: false }
    }
  }

  /**
   * Exchange long-lived token
   * Exchange a short-lived token for a long-lived one (60 days)
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    accessToken: string
    expiresIn: number
  }> {
    if (!this.appId || !this.appSecret) {
      throw ErrorFactory.serviceUnavailable('Facebook OAuth not configured')
    }

    try {
      const response = await axios.get(this.tokenEndpoint, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      })

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5183999,
      }
    } catch (error: any) {
      logger.error('Facebook long-lived token exchange failed', {
        error: error.response?.data || error.message,
      })

      throw ErrorFactory.serviceUnavailable('Failed to exchange for long-lived token')
    }
  }

  /**
   * Revoke login permissions
   * This will invalidate all user tokens for the app
   */
  async revokePermissions(userId: string, accessToken: string): Promise<void> {
    try {
      await axios.delete(
        `https://graph.facebook.com/v18.0/${userId}/permissions`,
        {
          params: { access_token: accessToken },
        }
      )
    } catch (error: any) {
      logger.error('Facebook permissions revocation failed', {
        error: error.response?.data || error.message,
      })
      // Don't throw error for revocation failures
    }
  }

}

// Export singleton instance and class
export const facebookOAuthClient = new FacebookOAuthClient()