/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Service configuration data
 */
export type ServiceConfigResponse = {
    serviceName: string;
    environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST';
    configuration: Record<string, any>;
    /**
     * ISO 8601 datetime with timezone
     */
    lastUpdated: string;
    version: string;
};

