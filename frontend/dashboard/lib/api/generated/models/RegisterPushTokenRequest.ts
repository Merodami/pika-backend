/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Register device for push notifications
 */
export type RegisterPushTokenRequest = {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId?: string;
    deviceName?: string;
};

