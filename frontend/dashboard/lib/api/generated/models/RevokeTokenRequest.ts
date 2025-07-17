/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Token revocation request
 */
export type RevokeTokenRequest = {
    /**
     * Token to revoke
     */
    token: string;
    /**
     * Hint about token type
     */
    tokenTypeHint?: 'accessToken' | 'refreshToken';
    /**
     * Revoke all tokens for user
     */
    allDevices?: boolean;
};

