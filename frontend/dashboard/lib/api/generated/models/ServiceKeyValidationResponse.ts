/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Service key validation result
 */
export type ServiceKeyValidationResponse = {
    valid: boolean;
    serviceName?: string;
    permissions?: Array<string>;
    rateLimit?: {
        limit: number;
        remaining: number;
        /**
         * ISO 8601 datetime with timezone
         */
        resetAt: string;
    };
};

