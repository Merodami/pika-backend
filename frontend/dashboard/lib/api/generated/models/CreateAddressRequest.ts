/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create a new address
 */
export type CreateAddressRequest = {
    street: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    /**
     * ISO 3166-1 alpha-2 country code
     */
    country: string;
    type: 'HOME' | 'WORK' | 'BILLING' | 'SHIPPING' | 'OTHER';
    label?: string;
    isDefault?: boolean;
    instructions?: string;
    accessCode?: string;
    /**
     * Geographic point with latitude and longitude
     */
    coordinates?: {
        /**
         * Latitude
         */
        lat: number;
        /**
         * Longitude
         */
        lng: number;
    };
};

