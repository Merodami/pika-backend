# Simple Request Flow - A Request's Journey

## The Journey of a Request Through Pika

```mermaid
flowchart TD
    Start([User clicks 'Create Gym' button]) --> Frontend

    %% Frontend Layer with Files
    subgraph Frontend["🌐 Frontend (Browser)"]
        A[React validates form data<br/><i>components/GymForm.tsx</i>]
        B[SDK creates typed request<br/><i>api-microservices-sdk/src/public/sdk.gen.ts</i>]
        C[Add OAuth 2.0 Bearer token<br/><i>hooks/useAuth.ts</i>]

        A --> B --> C
    end

    %% Frontend Files Box
    FrontendFiles[["<b>📁 Frontend Files</b><br/>────────────────<br/><b>Form Component:</b><br/>• components/GymForm.tsx<br/>• components/GymForm.validation.ts<br/><br/><b>SDK Integration:</b><br/>• api-microservices-sdk/src/public/sdk.gen.ts<br/>• api-microservices-sdk/src/public/types.gen.ts<br/><br/><b>State Management:</b><br/>• store/gymSlice.ts<br/>• hooks/useCreateGym.ts"]]

    Frontend -.-> FrontendFiles

    Frontend --> |"POST /api/gyms<br/>Authorization: Bearer {token}"| Network1{{"📡 HTTPS Request<br/>Content-Type: application/json"}}

    Network1 --> Gateway

    %% API Gateway Layer with Files
    subgraph Gateway["🛡️ API Gateway :5500"]
        D[Check rate limits in Redis<br/><i>middleware/rateLimiter.ts</i>]
        E[Verify OAuth 2.0 Bearer token<br/><i>middleware/auth.ts</i>]
        F[Validate request with Zod schema<br/><i>middleware/routeValidation.ts</i>]
        G[Route to correct service<br/><i>routes/index.ts</i>]

        D --> E --> F --> G
    end

    %% Gateway Files Box
    GatewayFiles[["<b>📁 API Gateway Files</b><br/>────────────────<br/><b>packages/api-gateway/src/</b><br/><br/><b>Middleware:</b><br/>• middleware/rateLimiter.ts<br/>• middleware/auth.ts<br/>• middleware/routeValidation.ts<br/>• middleware/correlationId.ts<br/><br/><b>Configuration:</b><br/>• routes/index.ts<br/>• config/services.ts<br/>• server.ts"]]

    Gateway -.-> GatewayFiles

    Gateway --> |"X-API-Key: {service-key}<br/>X-Correlation-ID: {uuid}"| Service

    %% Service Layer with Files
    subgraph Service["⚙️ Gym Service :5503"]
        H[Controller receives request<br/><i>controllers/GymController.ts</i>]
        I[Check idempotency key<br/><i>@pika/http middleware</i>]
        J[Service applies business rules<br/><i>services/GymService.ts</i>]
        K[Repository prepares DB query<br/><i>repositories/GymRepository.ts</i>]

        H --> I --> J --> K
    end

    %% Service Files Box
    ServiceFiles[["<b>📁 Gym Service Files</b><br/>────────────────<br/><b>packages/services/gym/src/</b><br/><br/><b>Request Flow:</b><br/>• routes/GymRoutes.ts<br/>• controllers/GymController.ts<br/>• services/GymService.ts<br/>• repositories/GymRepository.ts<br/><br/><b>Data Transformation:</b><br/>• mappers/GymMapper.ts<br/>• dtos/CreateGymDto.ts<br/>• models/Gym.ts<br/><br/><b>Validation:</b><br/>• validators/GymValidator.ts"]]

    Service -.-> ServiceFiles

    Service --> Database

    %% Database Layer with Files
    subgraph Database["💾 PostgreSQL :5435"]
        L[Begin transaction<br/><i>Prisma transaction API</i>]
        M[Insert gym record<br/><i>prisma/models/gym.prisma</i>]
        N[Insert gym_settings<br/><i>prisma/models/gymSettings.prisma</i>]
        O[Commit transaction<br/><i>Return created records</i>]

        L --> M --> N --> O
    end

    %% Database Files Box
    DatabaseFiles[["<b>📁 Database Files</b><br/>────────────────<br/><b>packages/database/</b><br/><br/><b>Schema Definition:</b><br/>• prisma/models/gym.prisma<br/>• prisma/models/gymSettings.prisma<br/>• prisma/models/user.prisma<br/><br/><b>Client Configuration:</b><br/>• src/client.ts<br/>• src/middleware.ts<br/><br/><b>Migrations:</b><br/>• prisma/migrations/"]]

    Database -.-> DatabaseFiles

    Database --> Cache[["🚀 Update Redis cache<br/><i>packages/redis/src/client.ts</i>"]]

    Cache --> Response

    %% Response Journey with Files
    subgraph Response["📤 Response Journey"]
        P[Map domain to DTO<br/><i>mappers/GymMapper.ts</i>]
        Q[Serialize to JSON<br/><i>Express built-in</i>]
        R[Add HTTP headers<br/><i>middleware/responseHeaders.ts</i>]
        S[Compress response<br/><i>compression middleware</i>]

        P --> Q --> R --> S
    end

    %% Schema Files Box
    SchemaFiles[["<b>📁 Schema & Validation</b><br/>────────────────<br/><b>packages/api/src/public/</b><br/><br/><b>Request Schemas:</b><br/>• schemas/gym/create.ts<br/>• schemas/gym/update.ts<br/>• schemas/gym/search.ts<br/><br/><b>Response Schemas:</b><br/>• schemas/gym/gym.ts<br/>• schemas/common/pagination.ts<br/>• schemas/common/error.ts"]]

    Response -.-> SchemaFiles

    Response --> |"201 Created<br/>Location: /api/gyms/{id}"| Network2{{"📡 HTTPS Response<br/>Content-Encoding: gzip"}}

    Network2 --> FrontendResponse

    %% Frontend Response Handling
    subgraph FrontendResponse["🎯 Frontend Receives"]
        T[SDK parses response<br/><i>api-microservices-sdk/client.ts</i>]
        U[Update Redux/Zustand state<br/><i>store/gymSlice.ts</i>]
        V[React re-renders<br/><i>React reconciliation</i>]
        W[User sees success message<br/><i>components/Toast.tsx</i>]

        T --> U --> V --> W
    end

    FrontendResponse --> End([✅ Gym created successfully!])

    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef gateway fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    classDef service fill:#e8f5e9,stroke:#388e3c,stroke-width:3px
    classDef database fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    classDef response fill:#e0f2f1,stroke:#00796b,stroke-width:3px
    classDef fileBox fill:#f5f5f5,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5
    classDef network fill:#ffebee,stroke:#c62828,stroke-width:2px

    class A,B,C,T,U,V,W frontend
    class D,E,F,G gateway
    class H,I,J,K service
    class L,M,N,O database
    class P,Q,R,S response
    class FrontendFiles,GatewayFiles,ServiceFiles,DatabaseFiles,SchemaFiles fileBox
    class Network1,Network2 network
```

## File Structure Reference

### 🌐 **Frontend Layer**

```
📁 Frontend Files
├── components/
│   └── GymForm.tsx                 # React form component
├── hooks/
│   └── useCreateGym.ts            # Custom hook for gym creation
└── api-microservices-sdk/
    └── src/public/
        ├── sdk.gen.ts             # Generated SDK client
        └── types.gen.ts           # Generated TypeScript types
```

### 🛡️ **API Gateway Layer**

```
📁 packages/api-gateway/
├── src/
│   ├── middleware/
│   │   ├── rateLimiter.ts         # Redis-based rate limiting
│   │   ├── auth.ts                # JWT validation middleware
│   │   └── routeValidation.ts     # Zod schema validation
│   ├── routes/
│   │   └── index.ts               # Service routing configuration
│   └── server.ts                  # Gateway server setup
```

### ⚙️ **Service Layer**

```
📁 packages/services/gym/
├── src/
│   ├── controllers/
│   │   └── GymController.ts       # HTTP request handlers
│   ├── services/
│   │   └── GymService.ts          # Business logic implementation
│   ├── repositories/
│   │   └── GymRepository.ts       # Data access layer
│   ├── mappers/
│   │   └── GymMapper.ts           # DTO ↔ Domain transformations
│   └── routes/
│       └── GymRoutes.ts           # Route definitions
```

### 📋 **Schema & Validation**

```
📁 packages/api/
└── src/public/
    └── schemas/
        └── gym/
            ├── gym.ts             # Gym entity schema
            ├── create.ts          # Create gym request schema
            └── update.ts          # Update gym request schema
```

### 🔧 **Shared Middleware**

```
📁 packages/http/
└── src/infrastructure/express/
    └── middleware/
        ├── idempotency.ts         # Prevent duplicate processing
        ├── cache.ts               # HTTP caching decorator
        └── errorHandler.ts        # Global error handling
```

### 💾 **Data Layer**

```
📁 packages/database/
├── src/
│   └── client.ts                  # Prisma client instance
└── prisma/
    ├── schema.prisma              # Compiled schema (DO NOT EDIT)
    ├── base.prisma                # Base configuration
    ├── enums.prisma               # Enum definitions
    └── models/
        └── gym.prisma             # Gym model definition

📁 packages/redis/
└── src/
    └── client.ts                  # Redis client configuration
```

## Step-by-Step Journey

### 🎯 **"I am a request, and this is my story..."**

#### 1. **Birth in the Browser** 🌐

```
- I'm born when a user clicks "Create Gym"
- React validates the form data
- The TypeScript SDK wraps me with proper types
- I get an OAuth 2.0 Bearer token as my passport
```

#### 2. **Network Travel** 📡

```
- I travel through HTTPS, encrypted and secure
- CDN might cache my friends (GET requests)
- Load balancer directs me to a healthy server
```

#### 3. **Gateway Security Check** 🛡️

```
- Rate limiter checks if I'm spamming (Redis counter)
- My OAuth 2.0 Bearer token is verified
- Zod validates my structure matches the schema
- Router sends me to the Gym Service
```

#### 4. **Service Processing** ⚙️

```
- Controller greets me at port 5503
- Idempotency check ensures I'm not a duplicate
- Service layer applies business rules
- Repository translates me to SQL
```

#### 5. **Database Storage** 💾

```
- Transaction begins (all or nothing!)
- My data is inserted into tables
- Related records are created
- Transaction commits successfully
```

#### 6. **Cache Update** 🚀

```
- Redis cache is invalidated
- Hot data might be pre-cached
- Events are published to queues
```

#### 7. **Response Transformation** 📤

```
- Domain objects become DTOs
- Private fields are hidden
- JSON serialization happens
- Compression reduces my size
```

#### 8. **Journey Home** 🏠

```
- I travel back through the gateway
- CORS headers are added
- I arrive at the frontend SDK
- Redux/Zustand updates the state
- React re-renders the UI
- User sees "Gym created!" ✅
```

## Key Checkpoints & Validations

```mermaid
flowchart LR
    subgraph Validations["🔍 Validation Checkpoints"]
        V1[Frontend<br/>Form validation]
        V2[Gateway<br/>Zod schema]
        V3[Service<br/>Business rules]
        V4[Database<br/>Constraints]
    end

    V1 --> V2 --> V3 --> V4

    subgraph Failures["❌ What Could Go Wrong"]
        F1[Invalid input<br/>400 Bad Request]
        F2[No auth token<br/>401 Unauthorized]
        F3[Rate limited<br/>429 Too Many]
        F4[Duplicate key<br/>409 Conflict]
    end

    V1 -.-> F1
    V2 -.-> F2
    V2 -.-> F3
    V4 -.-> F4
```

## Timing Breakdown

```mermaid
gantt
    title Request Lifecycle Timeline (Target: <500ms total)
    dateFormat X
    axisFormat %Lms

    section Frontend
    Form Validation     :0, 10
    SDK Processing      :10, 20

    section Network
    Request Travel      :20, 30

    section Gateway
    Rate Limit Check    :30, 35
    OAuth Token Verify  :35, 45
    Schema Validation   :45, 55

    section Service
    Business Logic      :55, 155

    section Database
    Query Execution     :155, 255

    section Response
    Transformation      :255, 275
    Network Return      :275, 285
    Frontend Update     :285, 300
```

## Quick Reference Card

### 🚀 **Request Essentials**

- **Always includes**: OAuth 2.0 Bearer token, Content-Type, X-Request-ID
- **Validated at**: Frontend → Gateway → Service → Database
- **Cached at**: CDN (GET) → Redis → Browser State
- **Logged at**: Every layer with correlation ID

### 🛡️ **Security Layers**

1. HTTPS encryption
2. OAuth 2.0 Bearer token authentication
3. Rate limiting
4. Input validation (Zod schemas)
5. SQL injection protection (Prisma)

### ⚡ **Performance Tricks**

- Idempotency prevents duplicate processing
- Redis caching reduces database hits
- Connection pooling reuses DB connections
- Compression reduces payload size
- CDN serves static content

### 🔧 **Error Recovery**

- Frontend: Retry with exponential backoff
- Gateway: Circuit breaker for failing services
- Service: Transaction rollback on errors
- Response: Proper error codes and messages

## The End Result

**When everything works perfectly:**

1. ✅ User action completed
2. ✅ Data safely stored
3. ✅ UI updated instantly
4. ✅ All systems in sync
5. ✅ Happy user!

**Total journey time: ~300ms** 🚀
