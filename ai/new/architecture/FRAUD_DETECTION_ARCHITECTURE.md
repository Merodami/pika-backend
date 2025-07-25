# Fraud Detection and Management Architecture

## Overview

The Pika platform implements a comprehensive fraud detection and management system to protect businesses and maintain platform integrity. This document outlines the architecture, business rules, and implementation details of the fraud detection system.

## Business Context

### Target Market Considerations

- **Location**: Asunción, Paraguay (emerging market)
- **User Base**: Mix of tech-savvy and traditional users
- **Connectivity**: Areas with unreliable internet (offline support crucial)
- **Business Model**: Hybrid physical-digital voucher platform

### Fraud Risk Profile

- **Low Digital Literacy**: Higher risk of account sharing
- **Cash Economy**: Limited payment fraud, focus on redemption fraud
- **Small Market**: Easier to detect patterns, community-based verification
- **Multi-location Businesses**: Common, affects velocity checks

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Fraud Detection System                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │ Real-time       │  │ Fraud Case       │  │ Dashboard  ││
│  │ Detection       │  │ Management       │  │ Analytics  ││
│  │ (Soft Checks)   │  │ (Database)       │  │ (Metrics)  ││
│  └────────┬────────┘  └────────┬─────────┘  └──────┬─────┘│
│           │                    │                    │       │
│           └────────────────────┴────────────────────┘       │
│                              │                              │
│                    ┌─────────┴──────────┐                  │
│                    │  Redis Cache       │                  │
│                    │  (Temp Storage)    │                  │
│                    └────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Detection Strategy (MVP)

**Philosophy**: Soft validation with manual review

- **Allow First**: Never block legitimate customers
- **Flag & Review**: Mark suspicious activity for review
- **Business Decision**: Let business owners make final call
- **Learn & Adapt**: Build patterns from real data

## Fraud Detection Rules

### 1. Rapid Redemption Detection

```typescript
interface RapidRedemptionCheck {
  threshold: 5 // minutes
  severity: {
    under1Min: 'HIGH'
    under3Min: 'MEDIUM'
    under5Min: 'LOW'
  }
}
```

**Rationale**: Multiple redemptions in quick succession may indicate:

- Shared accounts
- Fraudulent activity
- System gaming

### 2. Velocity/Travel Speed Check

```typescript
interface VelocityCheck {
  warningSpeed: 60 // km/hour
  criticalSpeed: 100 // km/hour
  exceptions: {
    sameProvider: true // Multi-location businesses
  }
}
```

**Rationale**: Impossible travel speeds indicate:

- Account sharing
- Location spoofing
- Multiple device usage

### 3. Location Anomaly Detection

```typescript
interface LocationAnomalyCheck {
  baselineRedemptions: 3 // minimum history
  anomalyDistance: 30 // km from usual areas
  historyWindow: 7 // days
}
```

**Rationale**: Unusual locations may indicate:

- Account compromise
- Unusual but legitimate travel
- New customer behavior

### 4. Future Checks (Post-MVP)

- **Device Fingerprinting**: Track device changes
- **Behavioral Analysis**: Time patterns, category preferences
- **Network Analysis**: Linked accounts, referral abuse
- **Business Rules**: Max redemptions per day/week

## Database Schema

### fraud_cases Table

```sql
CREATE TABLE fraud_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Case Information
  case_number VARCHAR(20) UNIQUE NOT NULL, -- FRAUD-2024-0001
  redemption_id UUID NOT NULL REFERENCES redemptions(id),
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Detection Details
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  flags JSONB NOT NULL, -- Array of detected flags
  detection_metadata JSONB, -- Additional context

  -- Entities Involved
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  voucher_id UUID NOT NULL,

  -- Review Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Values: pending, reviewing, approved, rejected, false_positive

  -- Review Details
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,

  -- Actions Taken
  actions_taken JSONB, -- Array of actions
  -- e.g., [{type: 'block_customer', timestamp: '...', by: '...'}]

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fraud_cases_status ON fraud_cases(status);
CREATE INDEX idx_fraud_cases_customer ON fraud_cases(customer_id);
CREATE INDEX idx_fraud_cases_provider ON fraud_cases(provider_id);
CREATE INDEX idx_fraud_cases_detected_at ON fraud_cases(detected_at);
CREATE INDEX idx_fraud_cases_risk_score ON fraud_cases(risk_score);
```

### fraud_case_history Table (Audit Trail)

```sql
CREATE TABLE fraud_case_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fraud_case_id UUID NOT NULL REFERENCES fraud_cases(id),
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  performed_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## API Endpoints

### Fraud Management Router (`/fraud`)

#### 1. List Fraud Cases

```
GET /fraud/cases
Query params:
  - status: pending|reviewing|approved|rejected|false_positive
  - provider_id: UUID
  - customer_id: UUID
  - from_date: ISO date
  - to_date: ISO date
  - min_risk_score: 0-100
  - page: number
  - limit: number

Response: Paginated list of fraud cases
```

#### 2. Get Fraud Case Details

```
GET /fraud/cases/:id
Response: Full fraud case with redemption details
```

#### 3. Review Fraud Case

```
PUT /fraud/cases/:id/review
Body: {
  status: 'approved' | 'rejected' | 'false_positive',
  notes: string,
  actions: [
    { type: 'block_customer', duration_days: 30 },
    { type: 'void_redemption' },
    { type: 'flag_provider' }
  ]
}
```

#### 4. Fraud Statistics

```
GET /fraud/statistics
Query params:
  - provider_id?: UUID
  - period: 'day' | 'week' | 'month'

Response: {
  total_cases: number,
  pending_cases: number,
  false_positive_rate: number,
  top_fraud_types: [],
  risk_score_distribution: {}
}
```

## Implementation Flow

### 1. Detection Phase (During Redemption)

```typescript
// In RedeemVoucherCommandHandler
const fraudCheck = await fraudDetectionService.checkRedemption(attempt)

// Always allow redemption (soft validation)
const redemption = await repository.recordRedemption({
  ...data,
  metadata: { fraudCheck: fraudCheck.flags.length > 0 ? fraudCheck : null },
})

// Create fraud case if suspicious
if (fraudCheck.flags.length > 0) {
  await fraudCaseService.createCase({
    redemptionId: redemption.id,
    riskScore: fraudCheck.riskScore,
    flags: fraudCheck.flags,
    customerId,
    providerId,
    voucherId,
  })
}
```

### 2. Review Phase (Dashboard)

```typescript
// Business owner sees fraud alert
const pendingCases = await fraudCaseRepository.findPending(providerId)

// Reviews case details
const caseDetails = await fraudCaseService.getCaseWithContext(caseId)

// Takes action
await fraudCaseService.reviewCase(caseId, {
  status: 'rejected',
  notes: 'Customer confirmed legitimate - was traveling',
  actions: [{ type: 'whitelist_pattern' }],
})
```

### 3. Action Phase

```typescript
// System executes actions based on review
if (action.type === 'block_customer') {
  await customerService.blockCustomer(customerId, action.duration_days)
}
if (action.type === 'void_redemption') {
  await redemptionService.voidRedemption(redemptionId)
  await voucherService.restoreRedemption(voucherId) // Give back to customer
}
```

## Business Rules

### Case Creation

- **Automatic**: Any redemption with risk_score > 0
- **Threshold**: HIGH severity flags create urgent cases
- **Deduplication**: Multiple flags in same redemption = one case

### Review Requirements

- **Provider Access**: Only own cases unless admin
- **Admin Access**: All cases, override capability
- **Time Limits**: Cases auto-close after 30 days
- **Escalation**: High-risk cases notify admin after 24h

### Actions Available

1. **Approve**: Mark as legitimate
2. **Reject**: Mark as fraudulent
3. **False Positive**: Improve algorithm
4. **Block Customer**: Temporary or permanent
5. **Void Redemption**: Reverse the redemption
6. **Flag Pattern**: Add to whitelist/blacklist

## Security Considerations

### Data Privacy

- **PII Protection**: Mask customer details in logs
- **Access Control**: Role-based case access
- **Audit Trail**: All actions logged
- **Data Retention**: 90 days for cases, 1 year for statistics

### System Security

- **Rate Limiting**: Prevent review spam
- **Input Validation**: Strict validation on all inputs
- **CSRF Protection**: For dashboard actions
- **API Authentication**: JWT + role verification

## Monitoring and Metrics

### Key Metrics

```typescript
interface FraudMetrics {
  detection_rate: number // Cases per 1000 redemptions
  false_positive_rate: number // False positives / total cases
  review_time_avg: number // Hours to review
  action_rate: number // Cases resulting in action
  pattern_effectiveness: {} // Performance by fraud type
}
```

### Alerts

- High risk score (>80) → Immediate notification
- Pending cases > 24h → Admin notification
- Unusual patterns → Weekly report
- System errors → Ops team alert

## Future Enhancements

### Phase 2 (3-6 months)

- Machine learning for pattern detection
- Device fingerprinting
- Network analysis (linked accounts)
- Automated actions for clear cases
- Customer risk scoring

### Phase 3 (6-12 months)

- Real-time blocking (for extreme cases)
- Integration with external fraud databases
- Behavioral biometrics
- Merchant fraud detection
- Cross-platform fraud sharing

## Implementation Checklist

- [x] Design fraud detection algorithms
- [x] Implement FraudDetectionService
- [ ] Create fraud_cases database schema
- [ ] Implement FraudCase domain model
- [ ] Create FraudCaseRepository
- [ ] Build fraud management API endpoints
- [ ] Add dashboard components
- [ ] Implement review workflow
- [ ] Add fraud statistics
- [ ] Create admin notifications
- [ ] Test end-to-end flow
- [ ] Document for business users
- [ ] Train support team

## Success Criteria

### Technical

- Detection latency < 100ms
- Zero false blocks (soft validation)
- 99.9% uptime for fraud service
- Review actions < 5 seconds

### Business

- Fraud loss < 0.5% of GMV
- False positive rate < 10%
- Average review time < 4 hours
- Business satisfaction > 90%

## Conclusion

This fraud detection system balances security with user experience, particularly important in an emerging market. The soft validation approach ensures legitimate customers aren't blocked while giving businesses the tools to protect themselves. The system is designed to learn and improve over time, building market-specific patterns that traditional fraud systems might miss.
