# VoucherBook Platform - Offline Synchronization Architecture

## Offline-First Architecture Overview

```mermaid
graph TB
    subgraph "Flutter App Architecture"
        UI[User Interface]

        subgraph "Data Layer"
            Local[Local Database<br/>Hive/SQLite]
            Queue[Sync Queue<br/>Pending Actions]
            Cache[Data Cache<br/>Vouchers/Users]
        end

        subgraph "Sync Engine"
            Monitor[Connection Monitor]
            Processor[Queue Processor]
            Conflict[Conflict Resolver]
        end

        UI --> Local
        Local --> Cache
        Local --> Queue

        Monitor --> Processor
        Processor --> Queue
        Processor --> Conflict
    end

    subgraph "Network Layer"
        Online{Network Status}
        Online -->|Offline| LocalOps[Local Operations Only]
        Online -->|Online| SyncOps[Sync with Server]

        LocalOps --> Queue
        SyncOps --> API[API Gateway]
    end

    subgraph "Backend Services"
        API --> Services[Microservices]
        Services --> DB[(PostgreSQL)]
    end

    style LocalOps fill:#fff3e0
    style SyncOps fill:#e8f5e9
```

## Offline Data Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant LocalDB as Local Database
    participant Queue as Sync Queue
    participant Monitor as Network Monitor
    participant Server

    Note over App: Device Offline

    User->>App: Perform Action<br/>(Claim Voucher)
    App->>LocalDB: Save Locally
    LocalDB-->>App: Success
    App->>Queue: Add to Sync Queue
    Queue-->>App: Queued
    App-->>User: Show Success<br/>(Optimistic Update)

    Note over Monitor: Network Returns

    Monitor->>Monitor: Detect Connection
    Monitor->>Queue: Process Queue

    loop For Each Queued Action
        Queue->>Server: Send Action
        alt Success
            Server-->>Queue: 200 OK
            Queue->>Queue: Remove from Queue
            Queue->>LocalDB: Update Sync Status
        else Conflict
            Server-->>Queue: 409 Conflict
            Queue->>App: Resolve Conflict
            App->>LocalDB: Revert Changes
            App->>User: Notify Conflict
        else Network Error
            Server-->>Queue: Network Error
            Queue->>Queue: Keep in Queue
            Queue->>Monitor: Retry Later
        end
    end
```

## Sync Queue Management

```mermaid
graph TD
    subgraph "Action Types"
        Actions[User Actions]
        Actions --> Claim[CLAIM_VOUCHER]
        Actions --> Redeem[REDEEM_VOUCHER]
        Actions --> Review[SUBMIT_REVIEW]
        Actions --> Update[UPDATE_PROFILE]
        Actions --> Create[CREATE_VOUCHER]
    end

    subgraph "Queue Structure"
        Claim --> QueueEntry1[Queue Entry]
        Redeem --> QueueEntry2[Queue Entry]
        Review --> QueueEntry3[Queue Entry]

        QueueEntry1 --> Fields[Entry Fields<br/>- ID: unique<br/>- Action: type<br/>- Data: payload<br/>- Timestamp: created<br/>- Retries: count<br/>- Status: pending/synced/failed]
    end

    subgraph "Processing Logic"
        Fields --> Process{Process Queue}

        Process --> Order[FIFO Order]
        Order --> Send[Send to Server]

        Send --> Result{Result}
        Result -->|Success| Remove[Remove from Queue]
        Result -->|Retry| Increment[Increment Retries]
        Result -->|Fail| MaxRetries{Max Retries?}

        MaxRetries -->|No| Wait[Wait & Retry]
        MaxRetries -->|Yes| FailAction[Mark Failed<br/>Notify User]

        Wait --> Send
    end

    style Remove fill:#c8e6c9
    style FailAction fill:#ffcdd2
```

## Local Data Caching Strategy

```mermaid
graph LR
    subgraph "Cache Layers"
        Memory[Memory Cache<br/>Active Session]
        Disk[Disk Cache<br/>Persistent Storage]

        Memory --> Hot[Hot Data<br/>- Current Vouchers<br/>- User Profile<br/>- Recent Actions]

        Disk --> Cold[Cold Data<br/>- All Vouchers<br/>- Historical Data<br/>- Reference Data]
    end

    subgraph "Cache Operations"
        Read[Read Operation]
        Read --> CheckMem{In Memory?}
        CheckMem -->|Yes| ReturnMem[Return Immediately]
        CheckMem -->|No| CheckDisk{On Disk?}
        CheckDisk -->|Yes| LoadMem[Load to Memory]
        CheckDisk -->|No| FetchRemote[Fetch from Server]

        LoadMem --> ReturnMem
        FetchRemote --> SaveAll[Save to Disk & Memory]
        SaveAll --> ReturnMem
    end

    subgraph "Cache Invalidation"
        Update[Update Operation]
        Update --> InvalidateMem[Clear Memory Cache]
        Update --> InvalidateDisk[Update Disk Cache]
        Update --> QueueSync[Queue for Sync]
    end
```

## Conflict Resolution Strategies

```mermaid
graph TB
    subgraph "Conflict Types"
        Conflicts[Sync Conflicts]
        Conflicts --> Expired[Voucher Expired]
        Conflicts --> Claimed[Already Claimed]
        Conflicts --> Redeemed[Already Redeemed]
        Conflicts --> Limited[Limit Reached]
        Conflicts --> Invalid[Invalid State]
    end

    subgraph "Resolution Actions"
        Expired --> RevertUI1[Revert UI Change]
        Expired --> Notify1[Notify: Voucher Expired]

        Claimed --> RevertUI2[Revert Claim]
        Claimed --> Notify2[Notify: Already Claimed]

        Redeemed --> RevertUI3[Mark as Used]
        Redeemed --> Notify3[Notify: Already Used]

        Limited --> RevertUI4[Remove from Wallet]
        Limited --> Notify4[Notify: Limit Reached]

        Invalid --> RevertUI5[Reset State]
        Invalid --> Notify5[Request Refresh]
    end

    subgraph "User Feedback"
        Notify1 --> Toast[Show Toast Message]
        Notify2 --> Toast
        Notify3 --> Toast
        Notify4 --> Toast
        Notify5 --> Dialog[Show Dialog<br/>Action Required]
    end

    style RevertUI1 fill:#fff3e0
    style RevertUI2 fill:#fff3e0
    style RevertUI3 fill:#fff3e0
    style RevertUI4 fill:#fff3e0
    style RevertUI5 fill:#fff3e0
```

## Offline Redemption Process

```mermaid
stateDiagram-v2
    [*] --> Offline: No Connection

    Offline --> ScanQR: Scan Voucher QR

    ScanQR --> DecodeJWT: Decode Token

    DecodeJWT --> ValidateLocal: Local Validation

    ValidateLocal --> CheckSignature: Verify ECDSA Signature
    CheckSignature --> CheckTTL: Check Token TTL
    CheckTTL --> CheckNonce: Check Local Nonce

    CheckNonce --> Valid: All Checks Pass
    CheckNonce --> Invalid: Any Check Fails

    Valid --> RecordLocal: Record Redemption Locally
    RecordLocal --> QueueSync: Add to Sync Queue
    QueueSync --> ShowSuccess: Display Success

    Invalid --> ShowError: Display Error

    ShowSuccess --> WaitNetwork: Wait for Network
    ShowError --> [*]

    WaitNetwork --> Online: Connection Restored

    Online --> ProcessQueue: Process Sync Queue
    ProcessQueue --> SendServer: Send to Server

    SendServer --> ServerValidate: Server Validation

    ServerValidate --> Synced: Validation Success
    ServerValidate --> Conflict: Validation Failed

    Synced --> [*]
    Conflict --> ResolveConflict: Handle Conflict
    ResolveConflict --> [*]
```

## Data Synchronization Patterns

```mermaid
graph TB
    subgraph "Sync Patterns"
        Pull[Pull Pattern<br/>Fetch Latest Data]
        Push[Push Pattern<br/>Send Local Changes]
        Bidirectional[Bidirectional Sync<br/>Merge Changes]
    end

    subgraph "Pull Operations"
        Pull --> PullTrigger{Trigger}
        PullTrigger -->|App Launch| FetchAll[Fetch All Data]
        PullTrigger -->|Pull to Refresh| FetchUpdates[Fetch Updates Only]
        PullTrigger -->|Background| FetchDelta[Fetch Delta<br/>Since Last Sync]

        FetchAll --> MergeLocal1[Merge with Local]
        FetchUpdates --> MergeLocal2[Update Cache]
        FetchDelta --> MergeLocal3[Apply Changes]
    end

    subgraph "Push Operations"
        Push --> PushTrigger{Trigger}
        PushTrigger -->|User Action| QueueAction[Queue Action]
        PushTrigger -->|Network Return| ProcessAll[Process All Queued]
        PushTrigger -->|Timer| BatchSend[Batch Send]

        QueueAction --> WaitNetwork[Wait for Network]
        ProcessAll --> SendBatch[Send to Server]
        BatchSend --> SendBatch
    end

    subgraph "Conflict Resolution"
        MergeLocal1 --> DetectConflict{Conflict?}
        MergeLocal2 --> DetectConflict
        MergeLocal3 --> DetectConflict

        DetectConflict -->|Yes| ResolveStrategy{Strategy}
        DetectConflict -->|No| ApplyChanges[Apply Changes]

        ResolveStrategy -->|Server Wins| UseServer[Use Server Data]
        ResolveStrategy -->|Client Wins| UseClient[Use Local Data]
        ResolveStrategy -->|Merge| MergeData[Merge Both]
        ResolveStrategy -->|Ask User| UserChoice[User Decides]
    end
```

## Sync Status Monitoring

```mermaid
graph LR
    subgraph "Status Indicators"
        Indicators[Sync Status]
        Indicators --> Synced[✓ All Synced<br/>Green]
        Indicators --> Pending[⏳ Pending Sync<br/>Yellow]
        Indicators --> Error[✗ Sync Error<br/>Red]
        Indicators --> Offline[📵 Offline Mode<br/>Gray]
    end

    subgraph "User Interface"
        Synced --> UI1[No Indicator]
        Pending --> UI2[Show Sync Icon]
        Error --> UI3[Show Error Badge]
        Offline --> UI4[Show Offline Banner]

        UI2 --> Details2[Queue Count: 3]
        UI3 --> Details3[Tap to Retry]
        UI4 --> Details4[Using Cached Data]
    end

    subgraph "Sync Metrics"
        Metrics[Tracking]
        Metrics --> LastSync[Last Sync Time]
        Metrics --> QueueSize[Queue Size]
        Metrics --> FailedCount[Failed Items]
        Metrics --> DataAge[Cache Age]

        LastSync --> Display1[2 mins ago]
        QueueSize --> Display2[3 pending]
        FailedCount --> Display3[1 failed]
        DataAge --> Display4[Data from 1hr ago]
    end

    style Synced fill:#c8e6c9
    style Pending fill:#fff9c4
    style Error fill:#ffcdd2
    style Offline fill:#e0e0e0
```

## Performance Optimization

```mermaid
graph TD
    subgraph "Optimization Strategies"
        Strategy[Offline Performance]

        Strategy --> Batch[Batch Operations]
        Strategy --> Compress[Data Compression]
        Strategy --> Priority[Priority Queue]
        Strategy --> Throttle[Throttle Sync]
    end

    subgraph "Batch Processing"
        Batch --> Collect[Collect Actions]
        Collect --> Group[Group by Type]
        Group --> Send[Send as Batch]
        Send --> Process[Server Batch Process]
    end

    subgraph "Compression"
        Compress --> GZIP[GZIP Payloads]
        Compress --> Delta[Delta Sync Only]
        Compress --> Binary[Binary Format]
    end

    subgraph "Priority Queue"
        Priority --> High[High Priority<br/>- Redemptions<br/>- Payments]
        Priority --> Medium[Medium Priority<br/>- Claims<br/>- Updates]
        Priority --> Low[Low Priority<br/>- Reviews<br/>- Analytics]
    end

    subgraph "Throttling"
        Throttle --> Limit[Rate Limit<br/>10 req/sec]
        Throttle --> Delay[Exponential Backoff]
        Throttle --> Schedule[Scheduled Sync<br/>Every 5 min]
    end
```
