# VoucherBook Platform - Voucher Lifecycle Management

## Voucher State Transitions

```mermaid
stateDiagram-v2
    direction TB

    classDef draft fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#0d47a1
    classDef active fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20
    classDef claimed fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100
    classDef redeemed fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c
    classDef expired fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#b71c1c
    classDef suspended fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238

    [*] --> DRAFT: Business Creates Voucher

    DRAFT --> PUBLISHED: validateCanPublish()
    DRAFT --> SUSPENDED: Suspend for Review

    PUBLISHED --> CLAIMED: validateCanClaim()
    PUBLISHED --> EXPIRED: Auto-expire<br/>(validUntil < now)
    PUBLISHED --> SUSPENDED: Admin Suspension

    CLAIMED --> REDEEMED: validateCanRedeem()
    CLAIMED --> EXPIRED: 30-day claim window<br/>OR validUntil reached
    CLAIMED --> PUBLISHED: Release claim<br/>(user cancels)

    REDEEMED --> EXPIRED: validUntil reached

    SUSPENDED --> PUBLISHED: Resume after review
    SUSPENDED --> EXPIRED: Force expire

    EXPIRED --> [*]: Terminal State

    class DRAFT draft
    class PUBLISHED active
    class CLAIMED claimed
    class REDEEMED redeemed
    class EXPIRED expired
    class SUSPENDED suspended

    note right of DRAFT
        🔧 Business Rules:<br/>
        • Can be edited (validateCanUpdate)<br/>
        • Can be deleted (validateCanDelete)<br/>
        • Must pass validation to publish<br/>
        • Check validFrom/validUntil dates<br/>
        • Verify discount rules (1-100%)
    end note

    note right of PUBLISHED
        ✅ Business Rules:<br/>
        • Visible in marketplace<br/>
        • Available for claiming<br/>
        • Cannot be deleted (only expire)<br/>
        • Check maxRedemptions limit<br/>
        • Track impression metrics<br/>
        • QR code generation (JWT/ECDSA)
    end note

    note right of CLAIMED
        📱 Business Rules:<br/>
        • Reserved by specific user<br/>
        • 30-day redemption window<br/>
        • Shows in user wallet<br/>
        • Can be released back<br/>
        • Track claim metrics<br/>
        • Generate dynamic QR (5 min TTL)
    end note

    note left of REDEEMED
        🎯 Business Rules:<br/>
        • One-time use enforced<br/>
        • Cannot be updated<br/>
        • Transaction recorded<br/>
        • Increment currentRedemptions<br/>
        • Track redemption metrics<br/>
        • Trigger payment processing
    end note

    note left of EXPIRED
        ⏰ Expiration Triggers:<br/>
        • validUntil date passed<br/>
        • 30 days after claim (claimed)<br/>
        • Admin force expire<br/>
        • Max redemptions reached<br/>
        • Campaign ended
    end note

    note left of SUSPENDED
        🚫 Suspension Rules:<br/>
        • Fraud detection triggered<br/>
        • Admin manual review<br/>
        • Business violation<br/>
        • Can resume or expire<br/>
        • Not visible to users
    end note
```

## QR Code Generation and Validation Flow

```mermaid
graph TB
    subgraph "QR Code Generation"
        Create[Create Voucher] --> GenPayload[Generate JWT Payload]

        GenPayload --> PayloadType{Voucher Type?}

        PayloadType -->|Digital/App| UserToken[User-Specific Token<br/>5 min TTL]
        PayloadType -->|Physical/Print| PrintToken[Campaign Token<br/>30 day TTL]

        UserToken --> SignToken[Sign with ECDSA]
        PrintToken --> SignToken

        SignToken --> EncodeQR[Encode as QR Code]
        EncodeQR --> GenShortCode[Generate Short Code<br/>SAVE-2K9P]

        GenShortCode --> StoreRedis[Store in Redis<br/>Code Mapping]
        StoreRedis --> ReturnCodes[Return QR + Short Code]
    end

    subgraph "QR Code Validation"
        ScanQR[Scan QR Code] --> DecodeJWT[Decode JWT Token]

        DecodeJWT --> OnlineCheck{Online?}

        OnlineCheck -->|Yes| ServerValidate[Server Validation]
        OnlineCheck -->|No| OfflineValidate[Local Validation]

        ServerValidate --> CheckDB[Check Database<br/>- Voucher Status<br/>- Redemption Count<br/>- User Authorization]

        OfflineValidate --> CheckSig[Verify Signature<br/>with Public Key]
        CheckSig --> CheckTTL[Check TTL<br/>Not Expired]
        CheckTTL --> CheckNonce[Check Nonce<br/>Not Reused]

        CheckDB --> Valid{Valid?}
        CheckNonce --> Valid

        Valid -->|Yes| Accept[Accept Redemption]
        Valid -->|No| Reject[Reject with Reason]

        Accept --> UpdateState[Update Voucher State]
        UpdateState --> RecordRedemption[Record Redemption]
        RecordRedemption --> NotifyUser[Notify User]
    end

    style Create fill:#e8f5e9
    style Accept fill:#c8e6c9
    style Reject fill:#ffcdd2
```

## Voucher Code Types and Usage

```mermaid
graph LR
    subgraph "Code Types"
        QRCode[QR Code<br/>JWT Token]
        ShortCode[Short Code<br/>8 Characters]
        StaticCode[Static Code<br/>Campaign Code]
    end

    subgraph "Digital Vouchers (App)"
        AppVoucher[App Voucher]
        AppVoucher --> QRCode
        AppVoucher --> ShortCode

        QRCode --> UniqueUser[Unique per User<br/>One-time Use]
        ShortCode --> Fallback1[Fallback for<br/>QR Issues]
    end

    subgraph "Physical Vouchers (Print)"
        PrintVoucher[Printed Voucher]
        PrintVoucher --> StaticCode
        PrintVoucher --> QRCode

        StaticCode --> SharedCode[Shared Code<br/>Multi-use]
        QRCode --> PrintQR[Static QR<br/>Campaign Based]
    end

    subgraph "Redemption Methods"
        Scanner[QR Scanner] --> ProcessQR[Process QR]
        Manual[Manual Entry] --> ProcessCode[Process Code]

        ProcessQR --> Validate[Validate Token]
        ProcessCode --> LookupCode[Lookup in Redis]

        LookupCode --> Validate
        Validate --> Result[Accept/Reject]
    end
```

## Physical Book Voucher Integration

```mermaid
graph TD
    subgraph "Book Creation"
        Monthly[Monthly Cycle] --> Collect[Collect Active Vouchers]
        Collect --> Filter[Filter by Status/Date]
        Filter --> Layout[Create Page Layout]
    end

    subgraph "Page Layout System"
        Layout --> Grid[8-Space Grid per Page]

        Grid --> Size{Ad Size?}
        Size -->|Full Page| Full[8 Spaces<br/>Premium]
        Size -->|Half Page| Half[4 Spaces<br/>Standard]
        Size -->|Quarter Page| Quarter[2 Spaces<br/>Basic]
        Size -->|Single| Single[1 Space<br/>Economy]

        Full --> Placement[Place on Page]
        Half --> Placement
        Quarter --> Placement
        Single --> Placement
    end

    subgraph "Content Generation"
        Placement --> GenContent[Generate Content]
        GenContent --> AddTitle[Add Title/Description]
        AddTitle --> AddTerms[Add Terms]
        AddTerms --> AddQR[Add QR Code]
        AddQR --> AddShort[Add Short Code]
        AddShort --> AddBranding[Add Business Branding]
    end

    subgraph "PDF Generation"
        AddBranding --> RenderHTML[Render HTML Template]
        RenderHTML --> ApplyCSS[Apply Print CSS]
        ApplyCSS --> ConvertPDF[Convert to PDF]
        ConvertPDF --> SaveS3[Save to S3]
        SaveS3 --> UpdateDB[Update Database]
    end

    subgraph "Distribution"
        UpdateDB --> Print[Send to Printer]
        Print --> Books[Physical Books]
        Books --> Distribute[Distribute to Locations]

        Distribute --> Track[Track Distribution]
        Track --> Analytics[Analytics Dashboard]
    end

    style Monthly fill:#fce4ec
    style Books fill:#f8bbd0
    style Analytics fill:#e1bee7
```

## Voucher Redemption Scenarios

```mermaid
graph TB
    Start[Customer at Store] --> Method{Redemption Method}

    Method -->|Digital App| AppFlow[App Redemption Flow]
    Method -->|Physical Book| PrintFlow[Print Redemption Flow]
    Method -->|Screenshot| ScreenFlow[Screenshot Flow]

    subgraph "App Redemption"
        AppFlow --> OpenWallet[Open Wallet]
        OpenWallet --> SelectVoucher[Select Voucher]
        SelectVoucher --> GenDynamic[Generate Dynamic QR<br/>5 min TTL]
        GenDynamic --> ShowQR1[Display QR]
        ShowQR1 --> Scan1[Retailer Scans]
        Scan1 --> Validate1[Validate Token]
        Validate1 --> OneTime[One-time Use Check]
        OneTime --> Success1[✓ Redeemed]
    end

    subgraph "Print Redemption"
        PrintFlow --> ShowPrinted[Show Printed QR/Code]
        ShowPrinted --> ScanPrint[Retailer Scans/Enters]
        ScanPrint --> CheckCampaign[Check Campaign Code]
        CheckCampaign --> CheckLimit[Check Usage Limit]
        CheckLimit --> LogUsage[Log Usage]
        LogUsage --> Success2[✓ Redeemed]
        Success2 --> PromoteApp[Promote App Download]
    end

    subgraph "Screenshot Handling"
        ScreenFlow --> ShowScreen[Show Screenshot]
        ShowScreen --> ScanScreen[Try to Scan]
        ScanScreen --> CheckValid{Valid QR?}
        CheckValid -->|No| EnterManual[Enter Short Code]
        CheckValid -->|Yes| CheckExpired{Token Expired?}
        CheckExpired -->|Yes| Reject1[✗ Expired Token]
        CheckExpired -->|No| CheckUsed{Already Used?}
        CheckUsed -->|Yes| Reject2[✗ Already Redeemed]
        CheckUsed -->|No| Success3[✓ Redeemed]
        EnterManual --> ValidateCode[Validate Code]
        ValidateCode --> Success4[✓ Redeemed]
    end

    style Success1 fill:#c8e6c9
    style Success2 fill:#c8e6c9
    style Success3 fill:#c8e6c9
    style Success4 fill:#c8e6c9
    style Reject1 fill:#ffcdd2
    style Reject2 fill:#ffcdd2
```

## Voucher Analytics and Tracking

```mermaid
graph LR
    subgraph "Tracking Points"
        Create[Creation] --> Publish[Publication]
        Publish --> Impression[Impressions]
        Impression --> Claim[Claims]
        Claim --> Redeem[Redemptions]
        Redeem --> Review[Reviews]
    end

    subgraph "Metrics Collected"
        Impression --> ViewCount[View Count<br/>Unique Users]
        Claim --> ClaimRate[Claim Rate<br/>Claims/Views]
        Redeem --> RedeemRate[Redemption Rate<br/>Redeems/Claims]
        Review --> Satisfaction[Satisfaction Score<br/>Avg Rating]
    end

    subgraph "Business Intelligence"
        ViewCount --> Funnel[Conversion Funnel]
        ClaimRate --> Funnel
        RedeemRate --> Funnel
        Satisfaction --> Funnel

        Funnel --> ROI[ROI Calculation]
        ROI --> Performance[Performance Dashboard]

        Performance --> Insights[Business Insights<br/>- Peak Times<br/>- Popular Categories<br/>- Geographic Patterns<br/>- Customer Segments]
    end

    subgraph "Reporting"
        Insights --> DailyReport[Daily Reports]
        Insights --> WeeklyReport[Weekly Summary]
        Insights --> MonthlyReport[Monthly Analytics]

        DailyReport --> Export[Export Options<br/>PDF/CSV/Excel]
        WeeklyReport --> Export
        MonthlyReport --> Export
    end
```
