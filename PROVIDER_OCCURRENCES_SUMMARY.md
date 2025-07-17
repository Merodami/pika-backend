# Provider Occurrences Summary

## Overview
This document summarizes all occurrences of "provider" (case-insensitive) found in the codebase, excluding node_modules, .git, pika-old, pika, .yarn, dist, .nx directories, and the technical term "StorageProvider".

## Key Findings

### 1. UserRole Enums with PROVIDER Value

#### Current Codebase (New Architecture)
- **packages/api/src/schemas/shared/enums.ts**: 
  - `export const UserRole = z.enum(['ADMIN', 'CUSTOMER', 'PROVIDER'])`
  - Found on line 25

- **frontend/dashboard/store/auth.store.ts**:
  - `export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN'`

- **frontend/dashboard/lib/validations/auth.ts**:
  - `accountType: z.enum(['PROVIDER', 'ADMIN']`

- **frontend/dashboard/app/(auth)/register/page.tsx**:
  - `accountType: z.enum(['PROVIDER', 'ADMIN']`

#### Old Codebase (pika-old)
Multiple occurrences in the old codebase showing PROVIDER as a user role throughout various services.

### 2. Database Models/Tables

#### Old Codebase Provider Model
- **pika-old/packages/database/prisma/models/provider.prisma**:
  - Contains a full `Provider` model with fields like:
    - userId, businessName, businessDescription, categoryId
    - verified, active, avgRating
    - Relations to User, Category, Vouchers, Reviews, etc.
  - Table name: `providers` in `marketplace` schema

### 3. Frontend Provider-Related Components and Routes

#### Provider Dashboard Routes
- **/frontend/dashboard/app/(dashboard)/provider/**:
  - `/provider/dashboard/page.tsx` - Provider dashboard page
  - `/provider/vouchers/page.tsx` - Provider vouchers management
  - `/provider/vouchers/create/page.tsx` - Create voucher page

#### Provider Components
- **frontend/dashboard/components/providers/notification-provider.tsx**
- **frontend/dashboard/lib/api/provider-adapter.ts** - API adapter for provider-related calls

### 4. Service Clients and Communication

#### Provider Service Client
- **ProviderServiceClient** class found in old codebase:
  - Used in redemption, campaign, and other services
  - Part of shared service clients infrastructure

### 5. Current Database Enums
- **packages/database/prisma/enums.prisma**:
  - Current UserRole enum only has: `ADMIN`, `USER` (no PROVIDER)
  - Has `StorageProvider` enum (technical term for file storage)

### 6. API Schema Inconsistency
- **packages/api/src/common/schemas/enums.ts**:
  - UserRole defined as: `z.enum(['ADMIN', 'USER'])` (no PROVIDER)
  - This is inconsistent with packages/api/src/schemas/shared/enums.ts

## Summary of Issues

1. **Role Inconsistency**: The API schemas have conflicting UserRole definitions:
   - `/common/schemas/enums.ts`: Only ADMIN and USER
   - `/schemas/shared/enums.ts`: Includes ADMIN, CUSTOMER, and PROVIDER

2. **Frontend Expectations**: The frontend dashboard expects PROVIDER role to exist and has dedicated provider routes

3. **Missing Provider Service**: The new architecture doesn't have a Provider service, but the frontend and some schemas reference providers

4. **Database Schema Mismatch**: The current database enum doesn't include PROVIDER role, but API schemas and frontend expect it

## Recommendations

1. **Clarify Business Model**: Determine if the new architecture should support providers as a user type or as a separate entity

2. **Update Database Schema**: If providers are needed, update the UserRole enum in the database to include PROVIDER

3. **Implement Provider Service**: If providers are part of the business model, implement a Provider service in the new architecture

4. **Fix Schema Consistency**: Ensure all UserRole definitions across the codebase are consistent

5. **Update Frontend**: Either implement provider functionality or remove provider-related routes and components from the frontend