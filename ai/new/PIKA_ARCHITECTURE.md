# Pika Platform Architecture - Complete System Overview

## High-Level System Architecture

```mermaid
graph TB
    %% External Users and Clients
    subgraph "Client Applications"
        Flutter[Flutter Mobile App<br/>iOS/Android/Web]
        ReactApp[React Dashboard<br/>Business Portal]
        WebApp[Next.js Web App<br/>Customer Portal]
    end

    %% API Gateway Layer
    subgraph "API Gateway Layer"
        Gateway[API Gateway<br/>Port 9000<br/>Fastify Router]
    end

    %% Core Services Layer
    subgraph "Microservices Architecture"
        subgraph "Core Business Services"
            UserSvc[User Service<br/>Port 5022<br/>Firebase Auth]
            VoucherSvc[Voucher Service<br/>Port 5025<br/>Lifecycle Mgmt]
            RedemptionSvc[Redemption Service<br/>Port 5026<br/>QR Validation]
            ProviderSvc[Provider Service<br/>Port 5027<br/>Business Mgmt]
            CategorySvc[Category Service<br/>Port 5020<br/>Hierarchical]
        end

        subgraph "Support Services"
            NotificationSvc[Notification Service<br/>Port 5023<br/>Firebase FCM]
            ReviewSvc[Review Service<br/>Port 5028<br/>Rating System]
            MessagingSvc[Messaging Service<br/>Port 5024<br/>Real-time Chat]
            CampaignSvc[Campaign Service<br/>Port 5030<br/>Marketing]
        end

        subgraph "Specialized Services"
            PDFSvc[PDF Generator<br/>Port 5029<br/>Voucher Books]
            CryptoSvc[Crypto Service<br/>JWT/QR Generation]
            AuthSvc[Auth Package<br/>Multi-provider]
        end
    end

    %% Infrastructure Layer
    subgraph "Infrastructure & Data"
        subgraph "Databases"
            PostgreSQL[(PostgreSQL<br/>PostGIS<br/>Multi-schema)]
            Redis[(Redis<br/>Cache & Sessions)]
        end

        subgraph "External Services"
            Firebase[Firebase<br/>Auth & FCM]
            Elasticsearch[(Elasticsearch<br/>Search Index)]
            S3[AWS S3<br/>File Storage]
        end

        subgraph "Development Tools"
            LocalStack[LocalStack<br/>AWS Emulation]
            TestContainers[TestContainers<br/>Integration Tests]
        end
    end

    %% Shared Libraries
    subgraph "Shared Packages"
        SharedLib["@pika/shared<br/>Common Utils"]
        TypesCore["@pika/types-core<br/>Type Definitions"]
        HTTP["@pika/http<br/>Fastify Utils"]
        DatabaseLib["@pika/database<br/>Prisma Client"]
        RedisLib["@pika/redis<br/>Cache Decorators"]
        SDK["@pika/sdk<br/>Auto-generated"]
        API["@pika/api<br/>OpenAPI Schemas"]
    end

    %% Connections
    Flutter --> Gateway
    ReactApp --> Gateway
    WebApp --> Gateway

    Gateway --> UserSvc
    Gateway --> VoucherSvc
    Gateway --> RedemptionSvc
    Gateway --> ProviderSvc
    Gateway --> CategorySvc
    Gateway --> NotificationSvc
    Gateway --> ReviewSvc
    Gateway --> MessagingSvc
    Gateway --> CampaignSvc
    Gateway --> PDFSvc

    %% Service to Infrastructure
    UserSvc --> PostgreSQL
    VoucherSvc --> PostgreSQL
    RedemptionSvc --> PostgreSQL
    ProviderSvc --> PostgreSQL
    CategorySvc --> PostgreSQL
    NotificationSvc --> PostgreSQL
    ReviewSvc --> PostgreSQL
    MessagingSvc --> PostgreSQL
    CampaignSvc --> PostgreSQL
    PDFSvc --> PostgreSQL

    %% Redis connections
    UserSvc --> Redis
    VoucherSvc --> Redis
    RedemptionSvc --> Redis
    ProviderSvc --> Redis
    CategorySvc --> Redis

    %% External service connections
    UserSvc --> Firebase
    NotificationSvc --> Firebase
    AuthSvc --> Firebase
    PDFSvc --> S3

    %% Shared library usage (dotted lines)
    UserSvc -.-> SharedLib
    VoucherSvc -.-> SharedLib
    RedemptionSvc -.-> SharedLib
    UserSvc -.-> DatabaseLib
    VoucherSvc -.-> DatabaseLib
    RedemptionSvc -.-> DatabaseLib

    %% Inter-service communication
    RedemptionSvc <--> VoucherSvc
    RedemptionSvc <--> ProviderSvc
    PDFSvc <--> VoucherSvc
    PDFSvc <--> CryptoSvc
    VoucherSvc --> CryptoSvc
```

## Database Schema Architecture

```mermaid
erDiagram
    %% Core User Management
    users {
        uuid id PK
        string email UK
        string firstName
        string lastName
        enum role
        enum status
        boolean emailVerified
        timestamp createdAt
        timestamp updatedAt
    }

    %% Provider Business Entities
    providers {
        uuid id PK
        uuid userId FK
        uuid categoryId FK
        jsonb businessName
        jsonb businessDescription
        boolean verified
        boolean active
        decimal avgRating
        integer reviewCount
    }

    categories {
        uuid id PK
        jsonb name
        jsonb description
        string slug UK
        integer level
        string path
        boolean active
        integer sortOrder
    }

    %% Voucher Lifecycle
    vouchers {
        uuid id PK
        uuid providerId FK
        uuid categoryId FK
        enum state
        jsonb title
        jsonb description
        jsonb terms
        enum discountType
        decimal discountValue
        string currency
        geography location
        timestamp validFrom
        timestamp expiresAt
        integer maxRedemptions
        integer maxRedemptionsPerUser
        integer currentRedemptions
        jsonb metadata
    }

    voucher_codes {
        uuid id PK
        uuid voucherId FK
        string code UK
        enum type
        boolean isActive
        jsonb metadata
        timestamp createdAt
    }

    %% Redemption System
    redemptions {
        uuid id PK
        uuid voucherId FK
        uuid customerId FK
        uuid providerId FK
        string code
        geography location
        jsonb metadata
        timestamp redeemedAt
        timestamp createdAt
    }

    fraud_cases {
        uuid id PK
        uuid redemptionId FK
        enum type
        enum status
        integer riskScore
        jsonb metadata
        uuid reviewedBy FK
        timestamp reviewedAt
        timestamp createdAt
    }

    %% Review System
    reviews {
        uuid id PK
        uuid voucherId FK
        uuid customerId FK
        uuid providerId FK
        integer rating
        jsonb comment
        enum status
        boolean isAnonymous
        timestamp createdAt
    }

    provider_responses {
        uuid id PK
        uuid reviewId FK
        uuid providerId FK
        jsonb response
        timestamp createdAt
    }

    %% PDF Generation System
    voucher_books {
        uuid id PK
        string title
        string edition
        enum bookType
        integer month
        integer year
        enum status
        integer totalPages
        string coverImageUrl
        string pdfUrl
        timestamp pdfGeneratedAt
        timestamp publishedAt
        uuid createdBy FK
        uuid providerId FK
    }

    voucher_book_pages {
        uuid id PK
        uuid bookId FK
        integer pageNumber
        enum layoutType
        jsonb metadata
    }

    ad_placements {
        uuid id PK
        uuid pageId FK
        integer position
        enum size
        integer spacesUsed
        enum contentType
        uuid voucherId FK
        string shortCode
        string title
        string description
        string imageUrl
        uuid providerId FK
        jsonb metadata
    }

    %% Messaging System
    conversations {
        uuid id PK
        uuid customerId FK
        uuid providerId FK
        enum status
        timestamp lastMessageAt
        timestamp createdAt
    }

    messages {
        uuid id PK
        uuid conversationId FK
        uuid senderId FK
        enum senderType
        text content
        enum messageType
        jsonb metadata
        boolean isRead
        timestamp createdAt
    }

    %% Campaign Management
    campaigns {
        uuid id PK
        uuid providerId FK
        jsonb title
        jsonb description
        enum status
        timestamp startDate
        timestamp endDate
        decimal budget
        jsonb targetAudience
        jsonb metadata
        timestamp createdAt
    }

    campaign_vouchers {
        uuid campaignId FK
        uuid voucherId FK
        integer priority
        timestamp createdAt
    }

    %% Notifications
    notifications {
        uuid id PK
        uuid userId FK
        jsonb title
        jsonb message
        enum type
        enum status
        jsonb data
        boolean isRead
        timestamp scheduledFor
        timestamp sentAt
        timestamp createdAt
    }

    %% Relationships
    users ||--o{ providers : "creates"
    providers ||--o{ vouchers : "publishes"
    providers }o--|| categories : "belongs_to"
    vouchers ||--o{ voucher_codes : "has_codes"
    vouchers ||--o{ redemptions : "redeemed"
    vouchers ||--o{ reviews : "reviewed"
    redemptions ||--o{ fraud_cases : "may_trigger"
    reviews ||--o{ provider_responses : "may_have"
    voucher_books ||--o{ voucher_book_pages : "contains"
    voucher_book_pages ||--o{ ad_placements : "has_ads"
    providers ||--o{ conversations : "chats_with"
    conversations ||--o{ messages : "contains"
    providers ||--o{ campaigns : "creates"
    campaigns ||--o{ campaign_vouchers : "includes"
    users ||--o{ notifications : "receives"
```

## Service Communication Flow

```mermaid
sequenceDiagram
    participant Customer as Customer App
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Voucher as Voucher Service
    participant Crypto as Crypto Service
    participant Provider as Provider Service
    participant Redemption as Redemption Service
    participant Notification as Notification Service

    %% Authentication Flow
    Customer->>Gateway: Login Request
    Gateway->>Auth: Validate Credentials
    Auth->>Auth: Generate JWT
    Auth-->>Gateway: JWT Token
    Gateway-->>Customer: Authenticated Session

    %% Voucher Discovery
    Customer->>Gateway: Browse Vouchers
    Gateway->>Voucher: Get Available Vouchers
    Voucher->>Provider: Validate Active Providers
    Provider-->>Voucher: Provider Status
    Voucher-->>Gateway: Voucher List
    Gateway-->>Customer: Display Vouchers

    %% Voucher Claiming
    Customer->>Gateway: Claim Voucher
    Gateway->>Voucher: Claim Request
    Voucher->>Crypto: Generate QR Code
    Crypto-->>Voucher: QR + Short Code
    Voucher-->>Gateway: Claimed Voucher
    Gateway-->>Customer: QR Code Ready

    %% Redemption Flow
    Customer->>Gateway: Present QR at Store
    Gateway->>Redemption: Validate Redemption
    Redemption->>Crypto: Verify QR Signature
    Crypto-->>Redemption: Valid/Invalid

    alt Valid Redemption
        Redemption->>Voucher: Update Voucher State
        Voucher-->>Redemption: State Updated
        Redemption->>Notification: Send Confirmation
        Notification-->>Customer: Push Notification
        Redemption-->>Gateway: Success Response
    else Invalid/Fraud
        Redemption->>Redemption: Log Fraud Case
        Redemption-->>Gateway: Fraud Alert
    end

    Gateway-->>Customer: Redemption Result
```

## CQRS Architecture Pattern

```mermaid
graph TB
    subgraph "Client Layer"
        UI[User Interface<br/>Flutter/React]
    end

    subgraph "API Layer"
        Router[HTTP Router<br/>Fastify]
    end

    subgraph "Application Layer - CQRS"
        subgraph "Command Side Write"
            CommandHandler[Command Handlers<br/>Business Logic]
            CommandRepo[Write Repositories<br/>Data Persistence]
        end

        subgraph "Query Side Read"
            QueryHandler[Query Handlers<br/>Data Retrieval]
            QueryRepo[Read Repositories<br/>Optimized Queries]
        end
    end

    subgraph "Domain Layer"
        Entities[Domain Entities<br/>Business Rules]
        Services[Domain Services<br/>Complex Logic]
        Events[Domain Events<br/>State Changes]
    end

    subgraph "Infrastructure Layer"
        WriteDB[(Write Database<br/>PostgreSQL)]
        ReadDB[(Read Cache<br/>Redis)]
        EventBus[Event Bus<br/>Domain Events]
    end

    %% Flow connections
    UI --> Router
    Router --> CommandHandler
    Router --> QueryHandler

    CommandHandler --> Entities
    QueryHandler --> Entities

    CommandHandler --> CommandRepo
    QueryHandler --> QueryRepo

    CommandRepo --> WriteDB
    QueryRepo --> ReadDB
    QueryRepo --> WriteDB

    Entities --> Events
    Events --> EventBus
    EventBus --> QueryRepo

    %% Domain connections
    CommandHandler -.-> Services
    QueryHandler -.-> Services
```

## Physical Voucher Book Generation Flow

```mermaid
flowchart TD
    subgraph "PDF Generation Workflow"
        Start([Admin Creates<br/>Voucher Book]) --> ValidateBook{Validate Book<br/>Configuration}

        ValidateBook -->|Valid| FetchVouchers[Fetch Vouchers<br/>from Database]
        ValidateBook -->|Invalid| Error1[Return Error]

        FetchVouchers --> GenerateQR[Generate QR Codes<br/>for Each Voucher]
        GenerateQR --> CreateLayout[Create Page Layout<br/>8 Spaces per Page]

        CreateLayout --> ValidateLayout{Validate<br/>Layout Rules}
        ValidateLayout -->|Valid| GeneratePDF[Generate PDF<br/>with PDFKit]
        ValidateLayout -->|Invalid| Error2[Layout Error]

        GeneratePDF --> UploadS3[Upload PDF to S3]
        UploadS3 --> UpdateStatus[Update Book Status<br/>to READY_FOR_PRINT]
        UpdateStatus --> NotifyAdmin[Notify Admin<br/>PDF Ready]
        NotifyAdmin --> EndProcess([PDF Generation<br/>Complete])

        Error1 --> EndProcess
        Error2 --> EndProcess
    end

    subgraph "Page Layout System"
        Page[A5 Page<br/>8 Spaces Grid] --> Space1[Space 1]
        Page --> Space2[Space 2]
        Page --> Space3[Space 3]
        Page --> Space4[Space 4]
        Page --> Space5[Space 5]
        Page --> Space6[Space 6]
        Page --> Space7[Space 7]
        Page --> Space8[Space 8]

        subgraph "Ad Sizes"
            Single[SINGLE<br/>1 Space]
            Quarter[QUARTER<br/>2 Spaces]
            Half[HALF<br/>4 Spaces]
            Full[FULL<br/>8 Spaces]
        end
    end

    subgraph "Content Types"
        VoucherContent[VOUCHER<br/>QR + Short Code]
        ImageContent[IMAGE<br/>Static Image]
        AdContent[AD<br/>Advertisement]
        SponsoredContent[SPONSORED<br/>Paid Content]
    end
```

## Fraud Detection System

```mermaid
stateDiagram-v2
    [*] --> RedemptionAttempt

    RedemptionAttempt --> RiskAssessment

    RiskAssessment --> LowRisk : Score < 30
    RiskAssessment --> MediumRisk : Score 30-70
    RiskAssessment --> HighRisk : Score > 70

    LowRisk --> Approved
    MediumRisk --> FlaggedForReview
    HighRisk --> Blocked

    FlaggedForReview --> UnderReview
    UnderReview --> AdminReview
    AdminReview --> Approved : Admin Approves
    AdminReview --> Blocked : Admin Rejects

    Blocked --> FraudCase
    FraudCase --> Investigation
    Investigation --> Resolved

    Approved --> [*]
    Resolved --> [*]

    note right of RiskAssessment
        Risk Factors:
        - Location anomalies
        - Velocity patterns
        - Device fingerprinting
        - Historical behavior
        - Code manipulation
    end note
```

## Technology Stack Overview

```mermaid
graph TB
    subgraph "Frontend Technologies"
        Flutter[Flutter Framework<br/>Dart 3.x<br/>Cross-platform]
        React[React 19.1.0<br/>Next.js 15.3.3<br/>Material-UI 7.1.1]
    end

    subgraph "Backend Technologies"
        Node[Node.js 22.x<br/>TypeScript 5.8.3<br/>ESM Modules]
        Fastify[Fastify 5.3.3<br/>High Performance<br/>HTTP Server]
        Prisma[Prisma 6.9.0<br/>Type-safe ORM<br/>Multi-schema]
    end

    subgraph "Database and Cache"
        Postgres[PostgreSQL 16<br/>PostGIS Extensions<br/>Spatial Queries]
        RedisDB[Redis 7.x<br/>ioredis 5.6.1<br/>Cache & Sessions]
        ElasticDB[Elasticsearch 8.x<br/>Search & Analytics]
    end

    subgraph "Infrastructure"
        Docker[Docker Compose<br/>Local Development]
        AWS[AWS CDK<br/>Cloud Infrastructure]
        NX[NX 21.1.3<br/>Monorepo Orchestration]
        Yarn[Yarn 4.9.1<br/>Package Management]
    end

    subgraph "Testing and Quality"
        Vitest[Vitest 3.2.2<br/>Unit & Integration]
        TestContainers[TestContainers 11.0.1<br/>Real DB Testing]
        ESLint[ESLint 9.28.0<br/>Code Quality]
        Prettier[Prettier 3.5.3<br/>Code Formatting]
    end

    subgraph "Security and Auth"
        Firebase[Firebase Admin SDK<br/>Authentication<br/>Cloud Messaging]
        JWT[JWT with ECDSA<br/>Cryptographic Signing<br/>Key Rotation]
        CORS[CORS & Helmet<br/>HTTP Security]
    end

    Flutter --> Node
    React --> Node
    Node --> Fastify
    Fastify --> Prisma
    Prisma --> Postgres
    Node --> RedisDB
    Node --> Firebase
    Fastify --> JWT
```
