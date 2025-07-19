/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ServiceDiscoveryService {
    /**
     * Get service registry
     * @returns any Service registry
     * @throws ApiError
     */
    public static getServicesRegistry({
        serviceName,
        serviceType,
        environment,
        status,
        region,
        tags,
        healthyOnly = true,
        includeMetrics = false,
    }: {
        serviceName?: string,
        serviceType?: 'API_GATEWAY' | 'MICROSERVICE' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'STORAGE' | 'MONITORING',
        environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST',
        status?: 'STARTING' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STOPPED',
        region?: string,
        tags?: Array<string>,
        healthyOnly?: boolean,
        includeMetrics?: boolean,
    }): CancelablePromise<{
        services: Array<{
            /**
             * Universally Unique Identifier
             */
            id: string;
            serviceName: string;
            serviceType: 'API_GATEWAY' | 'MICROSERVICE' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'STORAGE' | 'MONITORING';
            version: string;
            instanceId: string;
            endpoints: Array<{
                protocol: 'http' | 'https' | 'tcp' | 'grpc';
                host: string;
                port: number;
                path?: string;
                healthCheckPath?: string;
            }>;
            environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST';
            region?: string;
            availabilityZone?: string;
            status: 'STARTING' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STOPPED';
            /**
             * ISO 8601 datetime with timezone
             */
            lastHealthCheck?: string;
            healthCheckUrl?: string;
            metadata?: Record<string, string>;
            tags?: Array<string>;
            metrics?: {
                cpuUsage?: number;
                memoryUsage?: number;
                diskUsage?: number;
                requestCount?: number;
                errorRate?: number;
                responseTime?: number;
            };
            registeredBy?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            lastSeen: string;
            ttl?: number;
            /**
             * When the record was created
             */
            createdAt: string;
            /**
             * When the record was last updated
             */
            updatedAt: string;
        }>;
        totalCount: number;
        /**
         * ISO 8601 datetime with timezone
         */
        lastUpdated: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/services/registry',
            query: {
                'serviceName': serviceName,
                'serviceType': serviceType,
                'environment': environment,
                'status': status,
                'region': region,
                'tags': tags,
                'healthyOnly': healthyOnly,
                'includeMetrics': includeMetrics,
            },
        });
    }
    /**
     * Register service instance
     * @returns any Service registered
     * @throws ApiError
     */
    public static postServicesRegister({
        requestBody,
    }: {
        requestBody?: {
            serviceName: string;
            serviceType: 'API_GATEWAY' | 'MICROSERVICE' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'STORAGE' | 'MONITORING';
            version: string;
            instanceId: string;
            endpoints: Array<{
                protocol: 'http' | 'https' | 'tcp' | 'grpc';
                host: string;
                port: number;
                path?: string;
                healthCheckPath?: string;
            }>;
            environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST';
            region?: string;
            availabilityZone?: string;
            healthCheckUrl?: string;
            healthCheckInterval?: number;
            metadata?: Record<string, string>;
            tags?: Array<string>;
            ttl?: number;
            autoDeregister?: boolean;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        instanceId: string;
        serviceName: string;
        /**
         * ISO 8601 datetime with timezone
         */
        registeredAt: string;
        /**
         * ISO 8601 datetime with timezone
         */
        expiresAt: string;
        healthCheckUrl?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/services/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid registration data`,
            },
        });
    }
    /**
     * Deregister service instance
     * @returns any Service deregistered
     * @throws ApiError
     */
    public static deleteServicesDeregister({
        instanceId,
        requestBody,
    }: {
        instanceId: string,
        requestBody?: {
            reason?: 'SHUTDOWN' | 'MAINTENANCE' | 'ERROR' | 'SCALE_DOWN';
            gracefulShutdown?: boolean;
            drainConnections?: boolean;
            drainTimeoutSeconds?: number;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        instanceId: string;
        serviceName: string;
        /**
         * ISO 8601 datetime with timezone
         */
        deregisteredAt: string;
        gracefulShutdown: boolean;
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/services/{instanceId}/deregister',
            path: {
                'instanceId': instanceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Service instance not found`,
            },
        });
    }
    /**
     * Get service endpoints
     * @returns any Service endpoints
     * @throws ApiError
     */
    public static getServicesEndpoints({
        serviceName,
        environment,
        healthyOnly = true,
    }: {
        serviceName: string,
        environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST',
        healthyOnly?: boolean,
    }): CancelablePromise<{
        serviceName: string;
        instances: Array<{
            instanceId: string;
            endpoints: Array<{
                protocol: 'http' | 'https' | 'tcp' | 'grpc';
                host: string;
                port: number;
                path?: string;
                healthCheckPath?: string;
            }>;
            status: 'STARTING' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STOPPED';
            /**
             * ISO 8601 datetime with timezone
             */
            lastSeen: string;
            loadBalanceWeight?: number;
        }>;
        loadBalancingStrategy?: 'ROUND_ROBIN' | 'LEAST_CONNECTIONS' | 'WEIGHTED';
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/services/{serviceName}/endpoints',
            path: {
                'serviceName': serviceName,
            },
            query: {
                'environment': environment,
                'healthyOnly': healthyOnly,
            },
            errors: {
                404: `Service not found`,
            },
        });
    }
    /**
     * Get service configuration
     * @returns any Service configuration
     * @throws ApiError
     */
    public static getConfig({
        serviceName,
        serviceName,
        environment,
        configKeys,
    }: {
        serviceName: string,
        serviceName: string,
        environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST',
        configKeys?: Array<string>,
    }): CancelablePromise<{
        serviceName: string;
        environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST';
        configuration: Record<string, any>;
        /**
         * ISO 8601 datetime with timezone
         */
        lastUpdated: string;
        version: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/config/{serviceName}',
            path: {
                'serviceName': serviceName,
            },
            query: {
                'serviceName': serviceName,
                'environment': environment,
                'configKeys': configKeys,
            },
            errors: {
                404: `Service configuration not found`,
            },
        });
    }
}
