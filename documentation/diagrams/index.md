# VoucherBook Platform - Architecture Diagrams Index

## Overview

This directory contains comprehensive architectural diagrams for the VoucherBook platform, a hybrid physical-digital voucher system targeting the Paraguay market. The diagrams illustrate various aspects of the system architecture, user flows, and technical implementation details.

## Diagrams Collection

### 1. System Architecture Overview (`architecture-overview.md`)

**Purpose**: High-level view of the entire VoucherBook platform architecture

- Microservices architecture with 13 services
- Technology stack (Node.js 22, PostgreSQL, Redis, Firebase)
- API Gateway pattern with service mesh
- Infrastructure components (AWS/Docker deployment)

### 2. User Journey Flows (`user-flows.md`)

**Purpose**: Complete user journeys for all platform actors

- Customer voucher discovery and redemption flow
- Business/Retailer voucher creation and management flow
- Admin platform management flow
- Offline-first redemption process

### 3. Service Communication Architecture (`service-communication.md`)

**Purpose**: Inter-service communication patterns and data flow

- Service-to-service authentication using API keys
- Event-driven communication patterns
- Data synchronization between services
- Request/response flow through API Gateway

### 4. Voucher Lifecycle Management (`voucher-lifecycle.md`)

**Purpose**: Complete voucher state transitions and management

- States: NEW → PUBLISHED → CLAIMED → REDEEMED → EXPIRED
- QR code generation and validation flow
- Short code fallback mechanism
- Physical voucher book integration

### 5. Offline Synchronization Architecture (`offline-sync.md`)

**Purpose**: Offline-first capability and data synchronization

- Local cache management strategy
- Queue-based action synchronization
- Conflict resolution mechanisms
- Flutter app offline capabilities

### 6. PDF Generation and Physical Books (`pdf-generation.md`)

**Purpose**: Physical voucher book creation and distribution

- A5 format page layout system (8-space grid)
- Ad placement engine (SINGLE, QUARTER, HALF, FULL sizes)
- QR code integration for printed vouchers
- Distribution tracking system

### 7. Security and Fraud Detection (`security-fraud.md`)

**Purpose**: Platform security architecture and fraud prevention

- JWT-based authentication with ECDSA signatures
- QR code cryptographic validation
- Fraud detection scoring system
- Offline validation using public key cryptography

### 8. Database Schema Overview (`database-schema.md`)

**Purpose**: Multi-schema PostgreSQL database design

- Marketplace schema (vouchers, redemptions)
- Users schema (authentication, profiles)
- Files schema (PDF books, distributions)
- Audit schema (tracking, history)

### 9. Mobile Application Architecture (`mobile-architecture.md`)

**Purpose**: Flutter app architecture for customer and retailer apps

- Offline-first design with local database (Hive)
- State management patterns
- Push notification integration (FCM)
- Multi-language support (Spanish, Guaraní, English, Portuguese)

### 10. Deployment and Infrastructure (`deployment-infrastructure.md`)

**Purpose**: Production deployment architecture

- CI/CD pipeline with GitHub Actions
- Docker containerization strategy
- AWS services integration (ECS, RDS, S3, CloudFront)
- Monitoring and observability setup

## Key Business Features Illustrated

### Revenue Model

- Physical voucher book advertising (monthly A5 publications)
- Digital marketplace subscriptions
- Transaction fees on redemptions
- Premium placement features

### Target Market

- **Primary**: Small-medium businesses in Asunción, Paraguay
- **Secondary**: Traditional coupon book users transitioning to digital
- **Languages**: Spanish, Guaraní, English, Portuguese

### Unique Value Propositions

1. **Hybrid Model**: Bridges physical coupon books with digital marketplace
2. **Offline-First**: Full functionality without internet connectivity
3. **Multi-Channel**: App, printed books, web portal
4. **Fraud Prevention**: Cryptographic validation even offline
5. **Local Focus**: Multi-language support for Paraguay market

## Technical Highlights

### Backend Architecture

- **Pattern**: Clean Architecture with CQRS
- **Services**: 13 microservices in Node.js
- **Database**: PostgreSQL with PostGIS for geolocation
- **Cache**: Redis with decorators
- **Authentication**: Firebase Auth with JWT

### Frontend Technologies

- **Mobile**: Flutter (iOS/Android) with offline-first
- **Dashboard**: React 19 with Next.js 15
- **State Management**: Zustand (React), Provider/Riverpod (Flutter)

### Key Metrics

- **Tests**: 847 passing tests across 48 files
- **Services**: 13 fully implemented microservices
- **Performance**: Sub-50ms voucher validation
- **Offline**: 100% core functionality available offline

## How to Use These Diagrams

1. **For Business Stakeholders**: Start with the Architecture Overview and User Flows to understand the platform's capabilities
2. **For Developers**: Review Service Communication and Database Schema for technical implementation details
3. **For Product Teams**: Focus on User Flows and Voucher Lifecycle for feature planning
4. **For Security Teams**: Examine Security/Fraud Detection and Offline Sync diagrams
5. **For DevOps**: Check Deployment Infrastructure and Service Communication patterns

## Diagram Format

All diagrams are created using Mermaid syntax for easy maintenance and version control. They can be rendered in:

- GitHub/GitLab markdown viewers
- VS Code with Mermaid preview extensions
- Online Mermaid editors
- Documentation sites supporting Mermaid

## Updates

Last Updated: December 2024
Platform Status: Production Ready (MVP Complete)
