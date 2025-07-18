# Comprehensive Use Case Analysis: Pika Voucher Platform

## Executive Summary

Pika is a sophisticated digital voucher/coupon platform designed for Paraguay, connecting retailers with customers through promotional offers via a multilingual (Spanish, English, Guaraní, Portuguese) platform. Built with Domain-Driven Design principles and CQRS pattern, it supports offline-first operations, geospatial search, and cryptographic voucher security for both digital and printed voucher redemptions.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Core Business Domain Analysis](#2-core-business-domain-analysis)
3. [User Personas and Journeys](#3-user-personas-and-journeys)
4. [Detailed Use Case Scenarios](#4-detailed-use-case-scenarios)
5. [Technical Implementation Analysis](#5-technical-implementation-analysis)
6. [Business Model and Revenue Opportunities](#6-business-model-and-revenue-opportunities)
7. [Improvement Opportunities](#7-improvement-opportunities)
8. [Strategic Development Roadmap](#8-strategic-development-roadmap)
9. [Risk Assessment and Mitigation](#9-risk-assessment-and-mitigation)
10. [Competitive Analysis and Positioning](#10-competitive-analysis-and-positioning)

---

## 1. System Architecture Overview

### Technology Stack

- **Backend**: Node.js 20, TypeScript, Fastify (Microservices with DDD + CQRS)
- **Frontend**: React 19, Next.js 15, Ionic React, Material-UI
- **Database**: PostgreSQL 17 with PostGIS for geospatial operations
- **Infrastructure**: NX monorepo, AWS CDK, Docker containers
- **Real-time**: Firebase Firestore for messaging and notifications
- **Search**: Elasticsearch 8.x (configurable)
- **Payment**: Bancard integration (Paraguay's primary payment gateway)
- **Testing**: Vitest, Testcontainers, comprehensive E2E testing

### Service Architecture

```
API Gateway (9000) → Service Routing → Microservices:
├── User Service (5003) - Authentication, profiles, roles
├── Category Service (5000) - Hierarchical voucher categorization
├── Voucher Service (5001) - Voucher lifecycle management
├── Redemption Service (5002) - High-performance redemption validation
├── Review Service (5005) - Customer feedback system
├── PDF Generator Service (5006) - Monthly voucher book generation
├── Messaging Service - Real-time communication
└── Notification Service (5004) - Push notifications and alerts
```

---

## 2. Core Business Domain Analysis

### 2.1 Primary Business Entities

#### User Management Domain

- **Users**: Base authentication and profile management
- **Customers**: End users who discover and redeem vouchers
- **Retailers**: Businesses that create and publish voucher offers
- **Admins**: Platform administrators and moderators

#### Voucher Domain

- **Categories**: Hierarchical voucher classification (max 4 levels)
- **Vouchers**: Digital discount/coupon offerings with multilingual content
- **Redemptions**: Records of voucher usage with location and timestamp
- **Reviews**: Post-redemption rating and feedback system

#### Payment Domain

- **Payment Methods**: Cards, bank transfers, cash
- **Transactions**: Payment processing with Bancard
- **Refunds**: Admin-controlled refund management

#### Communication Domain

- **Conversations**: Context-aware messaging threads
- **Messages**: Text, images with delivery status
- **Notifications**: Push notifications and system alerts

### 2.2 Key Business Rules

#### Voucher Creation Rules

- Retailers must be verified to create vouchers
- Maximum 5 images per voucher with automatic thumbnails
- Multilingual content required (ES/EN/GN/PT)
- Discount specification in Paraguayan Guaraní (PYG) or percentage
- Geographic availability area definition
- Expiration date and usage limit constraints

#### Redemption Constraints

- Vouchers can only be redeemed once per customer
- QR code validation with cryptographic signatures
- Offline redemption support with public key verification
- Geographic validation for location-based vouchers
- Time-based restrictions (business hours, specific dates)

#### Review System Rules

- One review per redeemed voucher
- 1-5 star rating mandatory
- Retailer response capability
- Review authenticity through redemption verification

---

## 3. User Personas and Journeys

### 3.1 Customer Personas

#### Primary Customer: "María - Busy Professional"

- **Demographics**: 28-45 years old, urban professional
- **Goals**: Find reliable services quickly, save time
- **Pain Points**: Limited time, language preferences, trust concerns
- **Technology**: Smartphone-first, social media active

#### Secondary Customer: "Carlos - Small Business Owner"

- **Demographics**: 35-55 years old, business owner
- **Goals**: Find B2B services, build relationships
- **Pain Points**: Cost-sensitive, needs bulk/recurring services
- **Technology**: Desktop and mobile user

### 3.2 Provider Personas

#### Primary Provider: "Ana - Independent Professional"

- **Demographics**: 25-50 years old, skilled professional
- **Goals**: Grow customer base, manage schedule efficiently
- **Pain Points**: Marketing costs, payment delays, customer communication
- **Technology**: Mobile-focused, needs simple tools

#### Secondary Provider: "Roberto - Service Business Owner"

- **Demographics**: 40-60 years old, established business
- **Goals**: Scale operations, manage multiple employees
- **Pain Points**: Complex scheduling, payment management, quality control
- **Technology**: Desktop for management, mobile for field work

---

## 4. Detailed Use Case Scenarios

### 4.1 Customer Use Cases

#### UC-001: Service Discovery and Search

```gherkin
Feature: Service Discovery
  As a customer looking for services
  I want to discover and search for services
  So that I can find the right provider for my needs

Scenario: Browse services by category
  Given I am on the Pika homepage
  When I click on "Categorías" in the navigation
  Then I should see a hierarchical list of service categories
  And each category should show the number of available services
  And I should be able to navigate through subcategories
  And content should display in my selected language (ES/EN/GN)

Scenario: Search services by location and radius
  Given I am looking for services in my area
  When I enter my address in the location field
  And I set a search radius of 10km
  And I click "Buscar"
  Then I should see services within the specified radius
  And results should be sorted by distance (closest first)
  And each result should show distance and estimated travel time
  And I should see provider ratings and starting prices

Scenario: Filter search results
  Given I have search results displayed
  When I apply filters for:
    - Category: "Limpieza del hogar"
    - Price range: "50,000 - 200,000 PYG"
    - Rating: "4+ stars"
    - Availability: "Esta semana"
  Then results should update to match all selected criteria
  And I should see the number of matches
  And I can clear individual filters or all filters
```

#### UC-002: Voucher Discovery and Claiming Process

```gherkin
Feature: Voucher Discovery and Claiming
  As a customer
  I want to discover and claim vouchers
  So that I can save money on purchases

Scenario: Browse and claim available vouchers
  Given I am viewing the voucher discovery page
  And I can see vouchers "Cerca de mí"
  When I click on a voucher that interests me
  Then I should see voucher details including:
    - Discount amount or percentage
    - Expiration date
    - Terms and conditions
    - Retailer information and location
  And I can click "Agregar a mi billetera"
  And the voucher should be added to my digital wallet

Scenario: Search for specific voucher categories
  Given I want to find vouchers for a specific category
  When I search for "Comida" or "Restaurantes"
  Then I should see all available food-related vouchers
  And I can filter by:
    - Distance from my location
    - Discount amount
    - Expiration date
    - Retailer rating

Scenario: View claimed vouchers in digital wallet
  Given I have claimed several vouchers
  When I access "Mi billetera"
  Then I should see all my claimed vouchers organized by:
    - Active vouchers (not expired)
    - Expired vouchers
    - Redeemed vouchers
  And each voucher should show QR code for redemption
  And I can see usage instructions and retailer contact info
```

#### UC-003: Real-time Communication

```gherkin
Feature: Customer-Provider Communication
  As a customer
  I want to communicate with service providers
  So that I can clarify details and coordinate services

Scenario: Initiate conversation about a service
  Given I am viewing a service details page
  When I click "Contactar proveedor"
  Then a new conversation should be created
  And I can send an initial message with my inquiry
  And the conversation should be linked to the specific service
  And the provider should receive a push notification
  And I should see the provider's typical response time

Scenario: Real-time messaging for voucher inquiries
  Given I have questions about a voucher
  When I send a message to the retailer
  Then the message should appear instantly in the chat
  And I should see delivery confirmation (✓)
  And I should see read confirmation (✓✓) when retailer reads it
  And I can send text messages, images, and location
  And both parties can access voucher details from the conversation
```

### 4.2 Retailer Use Cases

#### UC-004: Voucher Management

```gherkin
Feature: Voucher Management
  As a retailer
  I want to create and manage my voucher offerings
  So that I can attract customers and drive sales

Scenario: Create a new voucher campaign
  Given I am a verified retailer
  When I navigate to "Mis Vouchers" and click "Crear Voucher"
  Then I should fill out voucher details in multiple languages:
    - Título del voucher (ES/EN/GN/PT)
    - Descripción detallada
    - Categoría y subcategoría
    - Tipo de descuento (porcentaje o monto fijo)
    - Valor del descuento
    - Fecha de expiración
  And I can upload up to 5 promotional images
  And I can define redemption locations (specific stores)
  And I can set usage limits and redemption constraints

Scenario: Manage voucher availability and campaigns
  Given I have active voucher campaigns
  When I access "Gestionar Vouchers"
  Then I can enable/disable vouchers for publication
  And I can extend or modify expiration dates
  And I can adjust usage limits and redemption rules
  And I can view real-time redemption analytics
  And changes should update in real-time for customer viewing

Scenario: Update voucher promotions and terms
  Given I want to modify my voucher offerings
  When I edit my voucher campaign
  Then I can update discount amounts and terms
  And I can create seasonal promotions or limited-time offers
  And I can set geographic restrictions for redemption
  And changes should be reflected immediately
  And already claimed vouchers should maintain original terms
```

#### UC-005: Redemption Management

```gherkin
Feature: Redemption Management
  As a retailer
  I want to validate and process voucher redemptions efficiently
  So that I can provide smooth customer experience and track usage

Scenario: Validate and redeem customer vouchers
  Given a customer wants to redeem a voucher at my store
  When they present the QR code from their digital wallet
  Then I can scan the code with my retailer app
  And the system should validate the voucher authenticity
  And I can see voucher details:
    - Discount amount or percentage
    - Voucher terms and conditions
    - Customer information
    - Expiration status
  And I can complete the redemption process
  And the voucher should be marked as redeemed to prevent reuse

Scenario: Handle offline redemption scenarios
  Given my internet connection is unreliable or unavailable
  When a customer presents a voucher for redemption
  Then I can use the offline validation feature
  And the system should verify the cryptographic signature locally
  And I can complete the redemption using cached public keys
  And the redemption should sync automatically when connectivity returns
  And I can handle any validation errors or expired vouchers
  And all offline redemptions should be logged for audit purposes
```

### 4.3 Administrative Use Cases

#### UC-006: Platform Administration

```gherkin
Feature: Platform Administration
  As a platform administrator
  I want to manage the marketplace operations
  So that I can ensure quality and resolve issues

Scenario: Manage voucher categories
  Given I am an admin user
  When I access the admin panel
  Then I can create, edit, or deactivate voucher categories
  And I can manage the hierarchical category structure
  And I can update category names in all supported languages
  And I can merge or split categories while preserving voucher associations
  And changes should be reflected across the platform immediately

Scenario: Handle retailer disputes and refunds
  Given there is a dispute between customer and retailer
  When I review the dispute details and evidence
  Then I can investigate the redemption history and voucher usage
  And I can communicate with both parties through the platform
  And I can disable fraudulent vouchers or retailers if needed
  And all actions should be logged for audit purposes

Scenario: Monitor platform health and performance
  Given I need to ensure platform stability
  When I access monitoring dashboards
  Then I can view key metrics:
    - Active users and session duration
    - Voucher claim and redemption rates
    - Retailer engagement and voucher creation rates
    - System performance and error rates
  And I can set up alerts for critical issues
  And I can access detailed logs for troubleshooting
```

---

## 5. Technical Implementation Analysis

### 5.1 Database Schema and Constraints

#### Core Tables and Relationships

```sql
-- User Management
users (id, email, phone, profile_data, created_at, updated_at)
customers (user_id, preferences, notification_settings)
retailers (user_id, business_info, verification_status, rating)

-- Voucher System
categories (id, parent_id, path, names_multilingual, slug)
vouchers (id, retailer_id, category_id, content_multilingual, discount_info, expiry, active)
voucher_images (id, voucher_id, url, thumbnail_url, order_index)

-- Redemption System
user_vouchers (id, voucher_id, customer_id, claimed_at, status)
redemptions (id, user_voucher_id, retailer_id, redeemed_at, location, qr_code_hash)

-- Communication
conversations (id, participants, context_type, context_id, created_at)
messages (id, conversation_id, sender_id, content, message_type, status)

-- Reviews
reviews (id, redemption_id, customer_id, retailer_id, rating, comment, response)
```

#### Key Constraints and Indexes

- Unique voucher redemption constraint: (user_voucher_id) - prevents double redemption
- Geospatial index on retailer locations for "near me" search
- Full-text search indexes on multilingual voucher content
- Materialized path indexes for category hierarchy
- Composite index on (customer_id, status) for user voucher queries

### 5.2 API Architecture and Endpoints

#### Authentication and Authorization

```typescript
// JWT-based authentication with Firebase integration
POST / api / v1 / auth / register
POST / api / v1 / auth / login
POST / api / v1 / auth / refresh - token
GET / api / v1 / auth / verify - email / { token }
POST / api / v1 / auth / forgot - password
```

#### Core Business APIs

```typescript
// Voucher Discovery
GET /api/v1/vouchers?category={id}&location={lat,lng}&radius={km}&page={n}
GET /api/v1/categories?include_counts=true
GET /api/v1/vouchers/{id}?include_retailer=true

// Voucher Management (Customer)
POST /api/v1/user-vouchers/{voucher_id}/claim
GET /api/v1/user-vouchers?status={status}&category={id}
GET /api/v1/user-vouchers/{id}/qr-code

// Redemption Management (Retailer)
POST /api/v1/redemptions/validate
POST /api/v1/redemptions
GET /api/v1/redemptions?date_from={date}&retailer_id={id}

// Real-time Communication
GET /api/v1/conversations?context={voucher|redemption}&context_id={id}
POST /api/v1/conversations/{id}/messages
WebSocket /api/v1/ws/conversations/{id}
```

### 5.3 Security Implementation

#### Authentication Flow

1. Firebase Auth for user registration/login
2. Custom JWT token generation with user roles
3. API Gateway token validation and routing
4. Service-level authorization checks

#### Data Protection

- Personal data encryption at rest
- PII data anonymization in logs
- GDPR compliance with data export/deletion
- Audit trails for all sensitive operations

---

## 6. Business Model and Revenue Opportunities

### 6.1 Current Revenue Streams

#### Retailer Subscription Tiers

- **Basic Plan**: Free tier with limited voucher creation and basic analytics
- **Business Plan**: Monthly subscription for enhanced features and analytics
- **Enterprise Plan**: Advanced features, API access, and bulk voucher management

#### Premium Features

- **Featured Vouchers**: Enhanced visibility in customer discovery
- **Analytics Dashboard**: Detailed redemption analytics and customer insights
- **Custom Branding**: Branded voucher templates and retailer pages

### 6.2 Expansion Opportunities

#### Market Expansion

- **Geographic**: Expand to other Latin American countries
- **Vertical**: Specialized marketplaces (health, education, automotive)
- **B2B Services**: Corporate service procurement platform

#### Technology Monetization

- **White-label Platform**: License technology to other marketplaces
- **API Services**: Monetize APIs for third-party integrations
- **Data Insights**: Analytics services for service providers

---

## 7. Improvement Opportunities

### 7.1 User Experience Enhancements

#### Short-term (1-3 months)

1. **Progressive Web App (PWA)**
   - Offline capability for basic browsing
   - Push notifications without app install
   - App-like experience on mobile devices

2. **Enhanced Search Experience**
   - Auto-complete search suggestions
   - Voice search capability
   - Visual search for service types
   - Saved search preferences

3. **Smart Recommendations**
   - Personalized voucher suggestions based on preferences
   - Location-based voucher recommendations
   - Previous redemption history integration

#### Medium-term (3-6 months)

1. **Advanced Voucher Features**
   - Loyalty program integration with point accumulation
   - Bundle vouchers for multiple retailers or categories
   - Social sharing and referral voucher bonuses
   - Time-sensitive flash voucher campaigns

2. **Enhanced Communication**
   - Video call integration for consultations
   - Voice messages in chat
   - File sharing capabilities
   - Real-time translation for cross-language communication

3. **Retailer Tools Enhancement**
   - Comprehensive analytics dashboard for voucher performance
   - Automated voucher campaign scheduling and management
   - Bulk voucher creation and management tools
   - Customer engagement and retention analytics

### 7.2 Technical Improvements

#### Performance Optimization

1. **Caching Strategy Enhancement**
   - Multi-level caching (CDN, application, database)
   - Intelligent cache invalidation
   - Edge caching for static assets

2. **Database Optimization**
   - Read replicas for heavy queries
   - Partitioning for large tables
   - Query optimization and indexing review

3. **Search Enhancement**
   - Full Elasticsearch implementation
   - Real-time indexing
   - Faceted search capabilities
   - Typo tolerance and fuzzy matching

#### Scalability Improvements

1. **Microservices Enhancement**
   - Event-driven architecture implementation
   - Service mesh for inter-service communication
   - Circuit breakers for resilience

2. **Infrastructure Automation**
   - Auto-scaling based on demand
   - Blue-green deployment strategy
   - Disaster recovery automation

---

## 8. Strategic Development Roadmap

### 8.1 Phase 1: Foundation Strengthening (Q1 2025)

#### Priority 1: User Experience

- [ ] Implement PWA features for mobile optimization
- [ ] Enhance search with auto-complete and filters
- [ ] Add smart recommendations engine
- [ ] Improve voucher discovery and claiming flow with better UX

#### Priority 2: Retailer Tools

- [ ] Build comprehensive retailer dashboard
- [ ] Add advanced voucher campaign management
- [ ] Implement bulk voucher creation and management
- [ ] Create redemption analytics and insights

#### Priority 3: Technical Debt

- [ ] Complete Elasticsearch integration
- [ ] Optimize database queries and indexing
- [ ] Enhance caching strategy
- [ ] Improve error handling and monitoring

### 8.2 Phase 2: Feature Expansion (Q2-Q3 2025)

#### New Features

- [ ] Video consultation integration for voucher inquiries
- [ ] Advanced voucher features (loyalty points, bundles)
- [ ] Gamification and rewards program for customers
- [ ] Retailer verification and certification system

#### Business Expansion

- [ ] B2B voucher distribution features
- [ ] Corporate voucher programs and bulk purchasing
- [ ] API for third-party integrations
- [ ] White-label voucher platform development

### 8.3 Phase 3: AI and Intelligence (Q4 2025 - Q1 2026)

#### AI-Powered Features

- [ ] Intelligent matching algorithm
- [ ] Dynamic pricing recommendations
- [ ] Fraud detection and prevention
- [ ] Predictive analytics for demand

#### Advanced Analytics

- [ ] Real-time business intelligence
- [ ] Customer behavior analysis
- [ ] Market trend prediction
- [ ] Provider performance optimization

---

## 9. Risk Assessment and Mitigation

### 9.1 Technical Risks

#### High Priority Risks

1. **Database Performance at Scale**
   - Risk: Query performance degradation with growth
   - Mitigation: Implement read replicas, query optimization, partitioning

2. **Real-time Messaging Reliability**
   - Risk: Firebase service interruptions
   - Mitigation: Implement fallback messaging system, redundancy

3. **Payment Gateway Dependency**
   - Risk: Bancard service issues or policy changes
   - Mitigation: Integrate multiple payment providers, implement retry logic

#### Medium Priority Risks

1. **Search Performance**
   - Risk: Elasticsearch complexity and maintenance
   - Mitigation: Implement hybrid search, fallback to database search

2. **Mobile Performance**
   - Risk: Poor performance on low-end devices
   - Mitigation: Progressive enhancement, performance monitoring

### 9.2 Business Risks

#### Market Risks

1. **Competition from International Players**
   - Risk: Large platforms entering Paraguay market
   - Mitigation: Focus on local advantages, superior user experience

2. **Economic Instability**
   - Risk: Currency fluctuation affecting pricing
   - Mitigation: Flexible pricing models, multiple payment options

#### Operational Risks

1. **Provider Quality Control**
   - Risk: Poor service quality affecting platform reputation
   - Mitigation: Robust review system, provider verification, quality monitoring

2. **Regulatory Compliance**
   - Risk: Changes in local regulations affecting operations
   - Mitigation: Legal compliance monitoring, flexible platform architecture

---

## 10. Competitive Analysis and Positioning

### 10.1 Market Position

#### Competitive Advantages

1. **Local Market Focus**: Deep understanding of Paraguay market and culture
2. **Multilingual Support**: Native support for Spanish, English, and Guaraní
3. **Payment Integration**: Seamless integration with Bancard (local payment leader)
4. **Geographic Intelligence**: PostGIS-powered location services
5. **Real-time Communication**: Integrated messaging and notifications

#### Key Differentiators

- **Cultural Sensitivity**: Understanding of local business practices and customs
- **Language Accessibility**: Guaraní support unique in marketplace space
- **Local Payment Methods**: Full integration with Paraguay's payment ecosystem
- **Community Focus**: Platform designed for local service economy

### 10.2 Competitive Landscape

#### Direct Competitors

1. **Regional Marketplaces**: Expanding international platforms
2. **Local Services Apps**: Smaller local service platforms
3. **Social Media Groups**: Facebook groups for service recommendations

#### Indirect Competitors

1. **Traditional Advertising**: Newspapers, radio, directory services
2. **Word-of-Mouth**: Traditional referral networks
3. **Direct Provider Websites**: Individual provider online presence

### 10.3 Strategic Positioning

#### Value Proposition

"Pika connects Paraguay's service providers with customers through a trusted, multilingual platform that understands local culture and business practices."

#### Target Market Strategy

1. **Primary Market**: Urban professionals seeking convenient service access
2. **Secondary Market**: Small to medium service providers needing digital presence
3. **Expansion Market**: Corporate clients requiring B2B services

---

## Conclusion

Pika represents a well-architected marketplace platform with strong technical foundations and clear understanding of the Paraguay market. The comprehensive use cases outlined above provide a roadmap for continued development and expansion.

The platform's multilingual support, local payment integration, and cultural awareness position it well for success in the Paraguay market. The suggested improvements and strategic roadmap will help maintain competitive advantage while scaling operations.

Key success factors moving forward:

1. **User Experience**: Continuous improvement of customer and provider experiences
2. **Technology Excellence**: Maintaining high-performance, reliable platform
3. **Market Understanding**: Leveraging local market knowledge for feature development
4. **Quality Control**: Ensuring high service quality through platform features
5. **Strategic Partnerships**: Building relationships with local businesses and institutions

This analysis provides the foundation for informed decision-making about platform development priorities and strategic direction.
