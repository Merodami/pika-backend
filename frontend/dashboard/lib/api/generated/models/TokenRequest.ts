/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * OAuth 2.0 compatible token request
 */
export type TokenRequest =
  | {
      grantType: 'password'
      /**
       * User email address
       */
      username: string
      /**
       * User password
       */
      password: string
      /**
       * Requested permissions
       */
      scope?: string
    }
  | {
      grantType: 'refreshToken'
      /**
       * Valid refresh token
       */
      refreshToken: string
      /**
       * Requested permissions (subset of original)
       */
      scope?: string
    }
