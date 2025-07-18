# Edge Cases & Real-World Scenarios

## Overview

This document outlines edge cases and real-world scenarios specific to the Paraguayan market and the hybrid physical-digital voucher platform.

## 1. Physical Book Distribution Scenarios

### Scenario: Damaged QR Codes

**Problem**: Rain, wear, or printing errors make QR codes unscannable.
**Solution**:

```typescript
// Fallback to short code entry
interface VoucherLookup {
  async findVoucher(input: string): Promise<Voucher> {
    // 1. Try as QR/JWT first
    if (this.isJWT(input)) {
      return this.decodeJWT(input);
    }

    // 2. Try as short code
    if (this.isShortCode(input)) {
      return this.lookupShortCode(input);
    }

    // 3. Fuzzy match for typos
    const candidates = await this.fuzzySearch(input);
    if (candidates.length === 1) {
      return candidates[0];
    }

    throw new Error('Multiple matches found, please be more specific');
  }
}
```

### Scenario: Lost/Stolen Books

**Problem**: Physical books can be lost or stolen before distribution.
**Solution**:

```typescript
interface BookTracking {
  // Track book lifecycle
  status: 'PRINTED' | 'IN_TRANSIT' | 'DISTRIBUTED' | 'REPORTED_LOST'

  // Invalidate codes from lost books
  async reportLostBook(bookId: string, serialNumbers: string[]) {
    // Mark all vouchers from this book range as suspicious
    await this.prisma.voucher.updateMany({
      where: {
        bookId,
        serialNumber: { in: serialNumbers }
      },
      data: {
        status: 'SUSPENDED',
        suspensionReason: 'Book reported lost'
      }
    });

    // Flag redemption attempts for manual review
    await this.alerting.notifyFraudTeam({
      type: 'LOST_BOOK_REDEMPTION_ATTEMPT',
      bookId,
      serialNumbers
    });
  }
}
```

## 2. Connectivity & Infrastructure Issues

### Scenario: Internet Outages During Peak Hours

**Problem**: Common in Paraguay, especially during storms.
**Solution**:

```typescript
// Business app offline mode
class OfflineRedemptionMode {
  // Pre-download daily voucher whitelist
  async syncDailyVouchers(): Promise<void> {
    const vouchers = await this.api.getBusinessVouchers()
    const publicKeys = await this.api.getPublicKeys()

    await this.localStorage.save({
      vouchers: vouchers.map((v) => ({
        id: v.id,
        validUntil: v.expiresAt,
        maxRedemptions: v.limit,
        signature: v.signature,
      })),
      publicKeys,
      syncedAt: new Date(),
    })
  }

  // Validate offline using crypto
  async validateOffline(qrCode: string): Promise<ValidationResult> {
    const jwt = this.parseJWT(qrCode)
    const voucher = await this.localStorage.getVoucher(jwt.vid)

    // Check signature
    if (!this.crypto.verify(jwt, voucher.publicKey)) {
      return { valid: false, reason: 'Invalid signature' }
    }

    // Check local redemption count
    const localRedemptions = await this.localStorage.getRedemptions(jwt.vid)
    if (localRedemptions.length >= voucher.maxRedemptions) {
      return { valid: false, reason: 'Redemption limit reached' }
    }

    // Queue for sync
    await this.localStorage.queueRedemption({
      voucherId: jwt.vid,
      timestamp: new Date(),
      signature: this.crypto.sign(redemption, this.businessKey),
    })

    return { valid: true, queued: true }
  }
}
```

### Scenario: Power Outages at Businesses

**Problem**: Common during summer, POS systems down.
**Solution**:

```typescript
// SMS fallback redemption
class SMSRedemption {
  // Customer sends: "REDEEM PIZZA50 to 1234"
  async processSMS(from: string, message: string) {
    const [command, code] = message.split(' ')

    if (command !== 'REDEEM') return

    const voucher = await this.findVoucherByCode(code)
    const customer = await this.findCustomerByPhone(from)

    // Validate
    if (await this.canRedeem(voucher, customer)) {
      await this.recordRedemption(voucher, customer, 'SMS')

      // Send confirmation
      await this.sms.send(from, `✓ Cupón ${code} canjeado! Muestre este SMS en el local.`)
    }
  }
}
```

## 3. Cultural & Market-Specific Scenarios

### Scenario: Family Sharing of Vouchers

**Problem**: In Paraguay, families often share deals. One person might scan for the whole family.
**Solution**:

```typescript
interface FamilySharing {
  // Allow "claiming" on behalf of others
  async claimForFamily(voucherId: string, claimerUserId: string) {
    const claim = await this.createClaim({
      voucherId,
      claimedBy: claimerUserId,
      claimType: 'FAMILY_SHARED',
      shareableLink: this.generateShareableLink(voucherId)
    });

    // Generate family-specific QR that anyone can use once
    const familyQR = await this.generateFamilyQR({
      voucherId,
      familyId: claim.id,
      validFor: 5, // 5 family members max
      expiresIn: '7d'
    });

    return { claim, familyQR };
  }
}
```

### Scenario: Guaraní Language Support

**Problem**: Many prefer Guaraní, especially outside Asunción.
**Solution**:

```typescript
// Deep language integration
interface MultilingualVoucher {
  title: {
    es: "50% de descuento en pizza",
    gn: "50% ñemboguejy pizza-pe",
    en: "50% off pizza"
  }

  // Auto-detect preferred language
  async getUserLanguage(userId: string): Promise<string> {
    // 1. Check user preference
    const preference = await this.getPreference(userId);
    if (preference) return preference;

    // 2. Check device language
    const deviceLang = request.headers['accept-language'];
    if (deviceLang?.includes('gn')) return 'gn';

    // 3. Check location (rural areas more likely Guaraní)
    const location = await this.getUserLocation(userId);
    if (this.isRuralArea(location)) return 'gn';

    return 'es'; // Default Spanish
  }
}
```

## 4. Business Operation Scenarios

### Scenario: Business Changes Ownership

**Problem**: Common in small businesses, new owner needs access.
**Solution**:

```typescript
class BusinessTransfer {
  async transferOwnership(businessId: string, newOwner: string) {
    // 1. Suspend current vouchers
    await this.suspendActiveVouchers(businessId)

    // 2. Create transfer record
    const transfer = await this.createTransfer({
      businessId,
      previousOwner: currentOwner,
      newOwner,
      transferDate: new Date(),
    })

    // 3. Migrate analytics history
    await this.migrateAnalytics(businessId, transfer.id)

    // 4. Issue new API keys
    await this.rotateAllKeys(businessId)

    // 5. Notify both parties
    await this.notify.transferComplete(transfer)
  }
}
```

### Scenario: Seasonal Businesses

**Problem**: Many businesses in Paraguay are seasonal (ice cream in summer, etc.)
**Solution**:

```typescript
interface SeasonalBusiness {
  // Auto-pause during off-season
  schedule: {
    activeMonths: [10, 11, 12, 1, 2, 3], // Oct-Mar for ice cream
    autoRenew: true
  }

  // Pre-season campaign setup
  async planSeasonalCampaign(businessId: string) {
    const schedule = await this.getSchedule(businessId);
    const nextSeason = this.calculateNextSeason(schedule);

    // Send reminder 1 month before season
    await this.scheduler.schedule({
      date: nextSeason.minus({ months: 1 }),
      task: 'REMIND_SEASONAL_CAMPAIGN',
      businessId
    });
  }
}
```

## 5. Fraud & Abuse Scenarios

### Scenario: Photocopy Abuse

**Problem**: People photocopy voucher pages and try to use multiple times.
**Solution**:

```typescript
class PhotocopyDetection {
  // Track redemption patterns
  async detectPhotocopy(redemption: Redemption) {
    // 1. Check if same QR redeemed at multiple locations quickly
    const recentRedemptions = await this.getRecent(redemption.qrCode, '1h')

    if (recentRedemptions.length > 1) {
      const locations = recentRedemptions.map((r) => r.location)
      const maxDistance = this.maxDistance(locations)

      if (maxDistance > 10000) {
        // 10km
        return {
          suspicious: true,
          reason: 'Same QR used at distant locations',
          action: 'REQUIRE_ORIGINAL_VERIFICATION',
        }
      }
    }

    // 2. Check image quality markers
    if (redemption.scanMetadata?.quality < 0.7) {
      return {
        suspicious: true,
        reason: 'Low quality scan suggests photocopy',
        action: 'MANUAL_VERIFICATION',
      }
    }
  }
}
```

### Scenario: Business Creating Fake Redemptions

**Problem**: Business might create fake redemptions to show higher performance.
**Solution**:

```typescript
class RedemptionAudit {
  async detectAnomalies(businessId: string) {
    const redemptions = await this.getRedemptions(businessId, '7d')

    // 1. Check redemption clustering
    const timeClusters = this.clusterByTime(redemptions)
    if (this.hasUnusualClustering(timeClusters)) {
      await this.flag('UNUSUAL_TIME_PATTERN', businessId)
    }

    // 2. Check customer diversity
    const uniqueCustomers = new Set(redemptions.map((r) => r.customerId))
    const diversityRatio = uniqueCustomers.size / redemptions.length

    if (diversityRatio < 0.3) {
      // Same customers repeatedly
      await this.flag('LOW_CUSTOMER_DIVERSITY', businessId)
    }

    // 3. Check against typical patterns
    const benchmark = await this.getBenchmark(businessId)
    if (redemptions.length > benchmark.p99) {
      await this.requireVerification(businessId)
    }
  }
}
```

## 6. Payment & Financial Scenarios

### Scenario: Partial Month Ad Booking

**Problem**: Business wants to advertise mid-month.
**Solution**:

```typescript
class ProRatedBilling {
  calculateAdCost(booking: AdBooking): BillingDetails {
    const daysInMonth = dayjs(booking.month).daysInMonth()
    const daysRemaining = daysInMonth - dayjs().date() + 1

    const proRatedAmount = (booking.basePrice * daysRemaining) / daysInMonth

    // Minimum charge threshold
    if (proRatedAmount < booking.basePrice * 0.25) {
      return {
        amount: booking.basePrice * 0.25,
        description: 'Minimum booking charge (25%)',
        startDate: dayjs().toDate(),
        endDate: dayjs(booking.month).endOf('month').toDate(),
      }
    }

    return {
      amount: Math.round(proRatedAmount),
      description: `Pro-rated for ${daysRemaining} days`,
      startDate: dayjs().toDate(),
      endDate: dayjs(booking.month).endOf('month').toDate(),
    }
  }
}
```

## 7. Technical Edge Cases

### Scenario: QR Code Version Conflicts

**Problem**: Old app versions might not support new QR features.
**Solution**:

```typescript
interface QRVersioning {
  // Embed version in QR
  generateQR(voucher: Voucher): string {
    const payload = {
      v: 2, // Version
      vid: voucher.id,
      // New fields for v2
      exp: voucher.expiresAt,
      lmt: voucher.limit
    };

    return this.jwt.sign(payload);
  }

  // Handle old versions gracefully
  parseQR(qr: string): VoucherInfo {
    const decoded = this.jwt.decode(qr);

    switch (decoded.v || 1) {
      case 1:
        // Old format - fetch additional data
        return this.enrichV1Data(decoded);
      case 2:
        // Current format
        return decoded;
      default:
        throw new Error('Unsupported QR version');
    }
  }
}
```

### Scenario: Database Split-Brain During Failover

**Problem**: Network partition causes data inconsistency.
**Solution**:

```typescript
class ConflictResolution {
  // Use event sourcing for critical operations
  async resolveRedemptionConflict(redemptions: Redemption[]) {
    // Sort by timestamp, earliest wins
    const sorted = redemptions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const winner = sorted[0]
    const conflicts = sorted.slice(1)

    // Mark others as duplicates
    for (const conflict of conflicts) {
      await this.markAsDuplicate(conflict, winner.id)

      // Refund if payment was taken
      if (conflict.paymentId) {
        await this.refundService.process(conflict)
      }
    }

    return winner
  }
}
```

## 8. Legal & Compliance Scenarios

### Scenario: Minor Protection

**Problem**: Minors shouldn't access certain vouchers (alcohol, etc.)
**Solution**:

```typescript
interface AgeRestriction {
  category: 'ALCOHOL' | 'TOBACCO' | 'GAMBLING' | 'ADULT'
  minimumAge: number

  async validateAge(userId: string, voucherId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    const voucher = await this.getVoucher(voucherId);

    if (!voucher.ageRestriction) return true;

    const age = dayjs().diff(user.birthDate, 'years');

    if (age < voucher.ageRestriction.minimumAge) {
      await this.logAttempt({
        userId,
        voucherId,
        reason: 'UNDERAGE',
        age
      });

      return false;
    }

    return true;
  }
}
```

## Implementation Priority Matrix

| Scenario          | Impact | Frequency | Complexity | Priority |
| ----------------- | ------ | --------- | ---------- | -------- |
| Damaged QR codes  | High   | High      | Low        | P0       |
| Internet outages  | High   | Medium    | Medium     | P0       |
| Family sharing    | Medium | High      | Low        | P1       |
| Photocopy fraud   | High   | Low       | Medium     | P1       |
| Language support  | High   | High      | Medium     | P0       |
| Seasonal business | Low    | Medium    | Low        | P2       |
| Power outages     | Medium | Low       | High       | P2       |

## Testing These Scenarios

```typescript
describe('Edge Case Testing', () => {
  test('Handles damaged QR gracefully', async () => {
    const partialQR = 'eyJhbGciOiJI...' // Truncated
    const result = await scanVoucher(partialQR)
    expect(result.fallbackMode).toBe('SHORT_CODE_ENTRY')
  })

  test('Offline redemption syncs eventually', async () => {
    // Simulate offline
    await networkOff()
    const redemption = await redeemOffline(voucher)
    expect(redemption.queued).toBe(true)

    // Restore network
    await networkOn()
    await waitForSync()

    // Verify synced
    const synced = await getRedemption(redemption.id)
    expect(synced.syncedAt).toBeDefined()
  })
})
```
