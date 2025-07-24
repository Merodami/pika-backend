/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ServiceRegistryQuery = {
    serviceName?: string;
    serviceType?: 'API_GATEWAY' | 'MICROSERVICE' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'STORAGE' | 'MONITORING';
    environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST';
    status?: 'STARTING' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STOPPED';
    region?: string;
    tags?: Array<string>;
    healthyOnly?: boolean;
    includeMetrics?: boolean;
};

