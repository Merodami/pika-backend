# VoucherBook Platform - Security and Fraud Detection Architecture (Enhanced)

## VoucherBook Security Architecture Overview

```mermaid
graph TB
    subgraph "Core Security Infrastructure"
        subgraph "API Gateway Security"
            Vercel[Vercel Edge Functions]
            RateLimit[Rate Limiting<br/>Per user/IP limits]
            InputVal[Input Validation<br/>Zod schemas]
            CORS[CORS Configuration<br/>Origin control]
        end

        subgraph "Application Security"
            HTTPSOnly[HTTPS Only<br/>TLS 1.3]
            SecHeaders[Security Headers<br/>HSTS, CSP, X-Frame]
            ParamBinding[Parameterized Queries<br/>SQL injection prevention]
            OutputEncode[Output Encoding<br/>XSS prevention]
        end

        subgraph "Authentication Layer"
            Firebase[Firebase Auth<br/>OAuth providers]
            JWT[JWT Management<br/>RS256 algorithm]
            RefreshTokens[Refresh Tokens<br/>7-day TTL]
            DeviceAuth[Device Management<br/>UserDevice model]
            MFA[Multi-Factor Auth<br/>UserMfaSettings]
        end

        subgraph "Authorization Layer"
            RBAC[Role-Based Access<br/>UserRole enum]
            APIKeys[API Key Management<br/>Service-to-service]
            ServiceAuth[Service Authentication<br/>x-api-key headers]
            ResourcePerms[Resource Permissions<br/>Clean architecture]
        end

        subgraph "Data Security"
            DBEncrypt[Database Encryption<br/>PostgreSQL TDE]
            TLS13[TLS 1.3<br/>All connections]
            PasswordHash[Password Hashing<br/>bcrypt]
            JWTSigning[JWT Signing<br/>RS256 keys]
        end

        subgraph "Monitoring & Audit"
            SecurityEvents[SecurityEvent Model<br/>Audit logging]
            FraudDetection[FraudCase Model<br/>ML-based detection]
            ActivityMonitor[Activity Monitoring<br/>User sessions]
            AuditTrail[Audit Trail<br/>All actions logged]
        end
    end

    Internet[Internet Traffic] --> Vercel
    Vercel --> RateLimit
    RateLimit --> InputVal
    InputVal --> Firebase
    Firebase --> JWT
    JWT --> RBAC
    RBAC --> APIKeys
    APIKeys --> Application[VoucherBook Services]

    Application --> SecurityEvents
    Application --> FraudDetection
    Application --> DBEncrypt

    style Vercel fill:#e3f2fd
    style Firebase fill:#fff3e0
    style FraudDetection fill:#ffebee
    style SecurityEvents fill:#e8f5e9
```

## VoucherBook Fraud Detection System

```mermaid
graph TB
    subgraph "Data Collection Layer"
        VoucherRedemption[Voucher Redemptions] --> FraudEngine[Fraud Detection Engine]
        VoucherScan[Voucher Scans] --> FraudEngine
        UserDevice[Device Info] --> FraudEngine
        SecurityEvent[Security Events] --> FraudEngine
        LocationData[GPS Location] --> FraudEngine

        FraudEngine --> RiskScoring[Risk Scoring System]
    end

    subgraph "Risk Analysis"
        RiskScoring --> Features[Feature Analysis]

        Features --> Velocity[Velocity Checks<br/>- Redemption frequency<br/>- Geographic patterns<br/>- Time-based anomalies]

        Features --> DeviceAnalysis[Device Analysis<br/>- Device fingerprinting<br/>- Multiple accounts<br/>- Suspicious changes]

        Features --> LocationAnalysis[Location Analysis<br/>- GPS validation<br/>- Impossible travel<br/>- Geofencing violations]

        Features --> HistoryAnalysis[History Analysis<br/>- Past behavior<br/>- Success patterns<br/>- Fraud history]
    end

    subgraph "Fraud Detection Logic"
        Velocity --> RiskEngine[Risk Assessment Engine]
        DeviceAnalysis --> RiskEngine
        LocationAnalysis --> RiskEngine
        HistoryAnalysis --> RiskEngine

        RiskEngine --> RuleEngine[Business Rules Engine]
        RiskEngine --> MLScoring[Basic ML Scoring]
        RuleEngine --> FinalScore[Final Risk Score]
        MLScoring --> FinalScore
    end

    subgraph "Risk Scoring Engine"
        Voting --> RiskScore[Risk Score Calculation<br/>0-100 scale]

        RiskScore --> Factors[Contributing Factors]
        Factors --> F1[Velocity: 30%]
        Factors --> F2[Location: 20%]
        Factors --> F3[Device: 20%]
        Factors --> F4[Pattern: 15%]
        Factors --> F5[History: 10%]
        Factors --> F6[Network: 5%]

        FinalScore --> CreateFraudCase[Create FraudCase Record]
        CreateFraudCase --> CaseStatus{Risk Level}
        CaseStatus -->|Low 0-30| AutoApprove[Auto-approve Transaction]
        CaseStatus -->|Medium 31-60| ReviewQueue[Queue for Review]
        CaseStatus -->|High 61-100| AutoBlock[Block Transaction]
    end

    subgraph "Fraud Case Management"
        AutoApprove --> ProcessTransaction[Process Normally]
        ReviewQueue --> ManualReview[Admin Review]
        AutoBlock --> BlockTransaction[Block & Log]

        ManualReview --> Decision{Admin Decision}
        Decision -->|Approve| UpdateCaseApproved[Update FraudCase Status]
        Decision -->|Reject| UpdateCaseRejected[Mark as Fraud]

        UpdateCaseApproved --> ProcessTransaction
        UpdateCaseRejected --> BlockTransaction
    end

    subgraph "Audit Trail"
        ProcessTransaction --> LogSuccess[Log Transaction Success]
        BlockTransaction --> LogBlocked[Log Blocked Transaction]

        LogSuccess --> FraudCaseHistory[Update FraudCaseHistory]
        LogBlocked --> FraudCaseHistory

        FraudCaseHistory --> Analytics[Fraud Analytics]
        Analytics --> Reporting[Admin Reports]
    end

    style AutoApprove fill:#c8e6c9
    style ReviewQueue fill:#fff9c4
    style AutoBlock fill:#ffcdd2
    style ProcessTransaction fill:#a5d6a7
    style BlockTransaction fill:#ff8a80
```

## VoucherBook Security Event Monitoring

```mermaid
graph TB
    subgraph "Security Event Sources"
        UserAuth[User Authentication]
        VoucherRedemption[Voucher Transactions]
        AdminActions[Admin Operations]
        APIRequests[API Access]
        DeviceActivity[Device Management]
    end

    subgraph "Event Processing"
        UserAuth --> SecurityEventModel[SecurityEvent Model]
        VoucherRedemption --> SecurityEventModel
        AdminActions --> SecurityEventModel
        APIRequests --> SecurityEventModel
        DeviceActivity --> SecurityEventModel

        SecurityEventModel --> EventClassification[Event Classification]
        EventClassification --> RiskAssessment[Risk Assessment]
    end

    subgraph "Threat Categories"
        RiskAssessment --> AuthThreats[Authentication Threats<br/>- Failed login attempts<br/>- Suspicious locations<br/>- Device anomalies]

        RiskAssessment --> VoucherFraud[Voucher Fraud<br/>- Multiple redemptions<br/>- Geographic violations<br/>- Velocity attacks]

        RiskAssessment --> AccountTakeover[Account Takeover<br/>- Session anomalies<br/>- Profile changes<br/>- Unauthorized access]
    end

    subgraph "Response Actions"
        AuthThreats --> AuthResponse[Authentication Response]
        VoucherFraud --> FraudResponse[Fraud Response]
        AccountTakeover --> AccountResponse[Account Response]

        AuthResponse --> BlockLogin[Block Login Attempts]
        FraudResponse --> BlockVoucher[Block Voucher Usage]
        AccountResponse --> LockAccount[Lock User Account]

        BlockLogin --> AdminAlert[Admin Notification]
        BlockVoucher --> AdminAlert
        LockAccount --> AdminAlert
    end

    subgraph "Audit Trail"
        AdminAlert --> AuditLog[Security Audit Log]
        AuditLog --> AdminDashboard[Admin Dashboard]
        AdminDashboard --> Investigation[Manual Investigation]
    end

    style AuthThreats fill:#ffccbc
    style VoucherFraud fill:#ffcdd2
    style AccountTakeover fill:#ff8a80
    style AdminAlert fill:#fff176
```

## VoucherBook Authentication and Session Management

```mermaid
graph TD
    subgraph "Firebase Authentication Flow"
        Login[Login Request] --> Firebase[Firebase Auth]
        Firebase --> AuthMethod{Auth Method}
        AuthMethod -->|Email/Password| EmailAuth[Email Authentication]
        AuthMethod -->|Google OAuth| GoogleAuth[Google OAuth]
        AuthMethod -->|Phone| PhoneAuth[Phone Authentication]

        EmailAuth --> FirebaseToken[Firebase ID Token]
        GoogleAuth --> FirebaseToken
        PhoneAuth --> FirebaseToken
    end

    subgraph "JWT Token Management"
        FirebaseToken --> JWTCreate[Create Custom JWT]
        JWTCreate --> JWTSign[Sign with RS256]
        JWTSign --> AccessToken[Access Token<br/>15 min TTL]
        JWTSign --> RefreshToken[Refresh Token<br/>7 day TTL]

        AccessToken --> RedisStore[Store in Redis]
        RefreshToken --> RedisStore
    end

    subgraph "Device and Session Tracking"
        RedisStore --> DeviceTracking[UserDevice Model]
        DeviceTracking --> DeviceInfo[Store Device Info<br/>- Device ID<br/>- Browser info<br/>- IP address<br/>- Last active]

        DeviceInfo --> SessionLimits[Session Limits<br/>Max 5 concurrent]
        SessionLimits --> SecurityEvents[Log Security Events]
    end

    subgraph "MFA Support"
        SecurityEvents --> MFACheck{MFA Required?}
        MFACheck -->|Yes| MFASettings[UserMfaSettings Model]
        MFASettings --> TOTPVerify[TOTP Verification]
        MFASettings --> SMSVerify[SMS Verification]

        TOTPVerify --> MFASuccess[MFA Success]
        SMSVerify --> MFASuccess
        MFASuccess --> AllowAccess[Allow Access]
    end

    subgraph "Session Validation"
        AllowAccess --> ValidateRequest[Validate Each Request]
        ValidateRequest --> CheckToken{Token Valid?}
        CheckToken -->|Yes| ProcessRequest[Process Request]
        CheckToken -->|No| RefreshFlow[Refresh Token Flow]

        RefreshFlow --> NewTokens[Issue New Tokens]
        NewTokens --> ProcessRequest
    end

    style Firebase fill:#fff3e0
    style AccessToken fill:#e8f5e8
    style MFASuccess fill:#c8e6c9
    style ProcessRequest fill:#a5d6a7
```

## VoucherBook API Security Overview

```mermaid
graph TD
    subgraph "API Gateway Security"
        Request[API Request] --> RateLimit[Rate Limiting<br/>Per user/IP limits]
        RateLimit --> InputValidation[Input Validation<br/>Zod schemas]
        InputValidation --> AuthCheck[Authentication Check]
        AuthCheck --> Authorization[Authorization Check<br/>Role-based access]
    end

    subgraph "Request Processing"
        Authorization --> Valid{Valid Request?}
        Valid -->|No| RejectRequest[Reject Request<br/>401/403 response]
        Valid -->|Yes| ProcessAPI[Process API Call]

        ProcessAPI --> BusinessLogic[Business Logic]
        BusinessLogic --> DatabaseQuery[Database Query<br/>Parameterized]
        DatabaseQuery --> Response[Return Response]
    end

    subgraph "Security Logging"
        RejectRequest --> SecurityLog[Log Security Event]
        ProcessAPI --> AuditLog[Log API Usage]
        SecurityLog --> SecurityEvents[SecurityEvent Model]
        AuditLog --> AuditTrail[Audit Trail]
    end

    style RateLimit fill:#fff3e0
    style AuthCheck fill:#e8f5e8
    style RejectRequest fill:#ffcdd2
    style Response fill:#c8e6c9
```
