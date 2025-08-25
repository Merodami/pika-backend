# VoucherBook Deep Linking & QR Code Strategy

## Overview

This document outlines the comprehensive strategy for implementing deep linking in VoucherBook's QR code system to enable smart app installation and direct voucher navigation.

## Current System Analysis

### QR Code Generation System

#### Backend (Sophisticated JWT-based system)
- **JWT-based QR codes** with cryptographic signing using `VoucherQRService` and `QRCodeService`
- **Two voucher types**: 
  - User vouchers (5-minute expiry for real-time redemption)
  - Print vouchers (30-day expiry for physical distribution)
- **Unique identifiers**: Each QR contains `voucherId`, `userId`, batch codes, and timestamps
- **Security features**: 
  - ECDSA signatures for tamper protection
  - Expiration validation
  - Nonce support for replay attack prevention
  - Enhanced validation with security warnings
- **Caching system**: Optimized generation with Redis caching for mobile scanning performance

#### Flutter App (Basic JWT handling)
- Current `QRGenerationService` for basic JWT creation/validation
- Uses `jwt_decoder` package for token parsing
- Mock signature system (development only, not production-ready)

### Current Deep Linking Status

#### iOS Info.plist
**Currently configured OAuth schemes only:**
```xml
<!-- Google Sign-In -->
<string>com.googleusercontent.apps.303337225326-f5c2c1b3e8d7a9b1c4e6f8d0</string>

<!-- Facebook Login -->
<string>fbYOUR_FACEBOOK_APP_ID</string>
```

#### Android Manifest
- **No custom URL schemes** for deep linking
- Only Facebook login intent filters configured
- **Missing**: VoucherBook-specific URL scheme for voucher navigation

#### Gap Analysis
❌ No VoucherBook-specific URL scheme for deep linking to vouchers
❌ No Universal Links/App Links configuration  
❌ No fallback mechanism for non-app users
❌ No marketing attribution tracking

## Recommended Deep Linking Strategy

### URL Structure Design

#### Primary Deep Link Format
```
voucherbook://voucher/{voucherId}?source=qr&utm_campaign=print
```

#### Universal Link Format (Web Fallback)
```
https://voucherbook.app/voucher/{voucherId}?source=qr&utm_campaign=print
```

#### URL Parameters
- **`voucherId`**: UUID from backend API (e.g., `123e4567-e89b-12d3-a456-426614174000`)
- **`source`**: Tracking source (`qr`, `share`, `web`, `email`)
- **`utm_campaign`**: Marketing attribution (`print`, `digital`, `social`)
- **Optional context**: `businessId`, `categoryId` for targeted fallbacks

#### Example URLs
```
# QR Code from printed voucher book
voucherbook://voucher/550e8400-e29b-41d4-a716-446655440000?source=qr&utm_campaign=print&businessId=abc123

# Shared voucher link
https://voucherbook.app/voucher/550e8400-e29b-41d4-a716-446655440000?source=share&utm_medium=whatsapp

# Marketing campaign
voucherbook://voucher/550e8400-e29b-41d4-a716-446655440000?source=qr&utm_campaign=summer2024
```

## Implementation Phases

### Phase 1: URL Scheme Configuration

#### iOS Info.plist Additions
Add to existing `CFBundleURLTypes` array:
```xml
<dict>
    <key>CFBundleURLName</key>
    <string>com.voucherbook.deeplink</string>
    <key>CFBundleURLSchemes</key>
    <array>
        <string>voucherbook</string>
    </array>
</dict>
```

#### Android Manifest Additions
Add to main activity `intent-filter`:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="voucherbook" 
          android:host="voucher" />
</intent-filter>

<!-- Universal Links support -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" 
          android:host="voucherbook.app" />
</intent-filter>
```

### Phase 2: Universal Links Configuration (App Store Intelligence)

#### Apple App Site Association (AASA)
Host at `https://voucherbook.app/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.voucherbook.app",
        "paths": ["/voucher/*", "/business/*", "/category/*"]
      }
    ]
  }
}
```

#### Android App Links - Digital Asset Links
Host at `https://voucherbook.app/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.voucherbook.app",
    "sha256_cert_fingerprints": ["YOUR_APP_SHA256_FINGERPRINT"]
  }
}]
```

### Phase 3: Backend QR Enhancement

#### Enhanced VoucherQRService Methods
```typescript
// packages/services/voucher/src/services/VoucherQRService.ts

/**
 * Generate deep link QR with smart fallbacks
 */
async generateDeepLinkQR(
  voucherId: string, 
  options?: {
    source?: 'print' | 'digital' | 'share';
    campaign?: string;
    businessId?: string;
    fallbackUrl?: string;
    trackingParams?: Record<string, string>;
  }
): Promise<{
  deepLink: string;
  universalLink: string;
  webFallback: string; 
  marketplaceFallback: { 
    ios: string; 
    android: string; 
  };
  qrPayload: string; // The actual QR code content
}> {
  const baseParams = {
    source: options?.source || 'qr',
    utm_campaign: options?.campaign,
    businessId: options?.businessId,
    ...options?.trackingParams
  };
  
  const queryString = new URLSearchParams(baseParams).toString();
  
  return {
    deepLink: `voucherbook://voucher/${voucherId}?${queryString}`,
    universalLink: `https://voucherbook.app/voucher/${voucherId}?${queryString}`,
    webFallback: options?.fallbackUrl || `https://voucherbook.app/voucher/${voucherId}`,
    marketplaceFallback: {
      ios: `https://apps.apple.com/app/voucherbook/id YOUR_APP_ID`,
      android: `https://play.google.com/store/apps/details?id=com.voucherbook.app`
    },
    qrPayload: `https://voucherbook.app/voucher/${voucherId}?${queryString}` // Universal link as QR content
  };
}
```

#### API Endpoint Enhancement
```typescript
// packages/api/src/schemas/voucher/public/voucher.ts

/**
 * Deep link generation request
 */
export const DeepLinkGenerationRequest = z.object({
  source: z.enum(['print', 'digital', 'share']).optional(),
  campaign: z.string().optional(),
  trackingParams: z.record(z.string(), z.string()).optional(),
});

/**
 * Deep link generation response
 */
export const DeepLinkGenerationResponse = z.object({
  deepLink: z.string().url(),
  universalLink: z.string().url(),
  webFallback: z.string().url(),
  marketplaceFallback: z.object({
    ios: z.string().url(),
    android: z.string().url(),
  }),
  qrCodeData: z.string(),
});
```

### Phase 4: Flutter Deep Link Handler

#### Add Dependencies
```yaml
# pubspec.yaml
dependencies:
  uni_links: ^0.5.1
  url_launcher: ^6.1.14
```

#### Deep Link Service
```dart
// lib/core/services/deep_link_service.dart

import 'dart:async';
import 'package:uni_links/uni_links.dart';
import 'package:flutter/services.dart';

class DeepLinkService {
  static StreamSubscription? _linkSubscription;
  
  static Future<void> initialize() async {
    try {
      // Handle app launch from deep link
      final initialLink = await getInitialLink();
      if (initialLink != null) {
        await _handleDeepLink(initialLink);
      }
      
      // Listen for deep links while app is running
      _linkSubscription = linkStream.listen(
        _handleDeepLink,
        onError: (err) {
          print('Deep link error: $err');
        },
      );
    } on PlatformException {
      // Handle exception
    }
  }
  
  static Future<void> _handleDeepLink(String link) async {
    final uri = Uri.parse(link);
    
    if (uri.scheme == 'voucherbook' && uri.host == 'voucher') {
      final voucherId = uri.pathSegments.first;
      final source = uri.queryParameters['source'];
      final campaign = uri.queryParameters['utm_campaign'];
      
      // Navigate to voucher detail screen
      await _navigateToVoucher(voucherId, source: source, campaign: campaign);
    }
  }
  
  static Future<void> _navigateToVoucher(
    String voucherId, {
    String? source,
    String? campaign,
  }) async {
    // Track deep link analytics
    await _trackDeepLinkOpen(voucherId, source, campaign);
    
    // Navigate using your existing router
    // GoRouter.of(context).go('/voucher/$voucherId');
  }
  
  static Future<void> _trackDeepLinkOpen(
    String voucherId, 
    String? source, 
    String? campaign,
  ) async {
    // Send analytics to backend
    // await voucherService.trackDeepLinkOpen(voucherId, source, campaign);
  }
  
  static void dispose() {
    _linkSubscription?.cancel();
  }
}
```

#### Integration with App Router
```dart
// lib/core/routing/app_router.dart

GoRoute(
  path: '/voucher/:voucherId',
  name: 'voucher-detail',
  builder: (context, state) {
    final voucherId = state.pathParameters['voucherId']!;
    final source = state.uri.queryParameters['source'];
    final campaign = state.uri.queryParameters['utm_campaign'];
    
    return VoucherDetailScreen(
      voucherId: voucherId,
      source: source,
      campaign: campaign,
    );
  },
),
```

### Phase 5: Smart Routing System

#### QR Code Scan Flow
```
QR Scan Detection
        ↓
Parse URL/Deep Link
        ↓
Check App Installation Status
        ↓
┌─────────────┬──────────────────┬─────────────────────┐
│ App         │ Universal Link   │ No App              │
│ Installed   │ (iOS/Android)    │ Installed           │
│             │                  │                     │
│ voucherbook │ https://         │ Web Page →          │
│ ://voucher/ │ voucherbook.app/ │ Install Prompt →    │
│ 123         │ voucher/123      │ App Store           │
└─────────────┴──────────────────┴─────────────────────┘
```

#### Web Fallback Page Structure
```html
<!-- https://voucherbook.app/voucher/{id} -->
<!DOCTYPE html>
<html>
<head>
  <title>VoucherBook - Voucher Details</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Smart App Banner for iOS -->
  <meta name="apple-itunes-app" content="app-id=YOUR_APP_ID, app-argument=voucherbook://voucher/123">
  
  <!-- Android Intent -->
  <meta name="google-play-app" content="app-id=com.voucherbook.app">
  
  <!-- Open Graph for sharing -->
  <meta property="og:title" content="Special Voucher - VoucherBook">
  <meta property="og:description" content="Claim this exclusive voucher in VoucherBook app">
  <meta property="og:image" content="https://voucherbook.app/voucher-preview.jpg">
</head>
<body>
  <div class="voucher-preview">
    <h1>Exclusive Voucher Available!</h1>
    <div class="voucher-details">
      <!-- Voucher information loaded via API -->
    </div>
    
    <div class="app-install-buttons">
      <a href="https://apps.apple.com/app/voucherbook/idYOUR_APP_ID" 
         class="ios-button">Download for iOS</a>
      <a href="https://play.google.com/store/apps/details?id=com.voucherbook.app" 
         class="android-button">Download for Android</a>
    </div>
    
    <div class="already-have-app">
      <a href="voucherbook://voucher/123" class="deep-link-button">
        Open in VoucherBook App
      </a>
    </div>
  </div>
  
  <script>
    // Smart redirect logic
    function detectAndRedirect() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        // Try deep link, fallback to App Store
        window.location = 'voucherbook://voucher/123';
        setTimeout(() => {
          window.location = 'https://apps.apple.com/app/voucherbook/idYOUR_APP_ID';
        }, 2000);
      } else if (isAndroid) {
        // Android intent with fallback
        window.location = 'intent://voucher/123#Intent;scheme=voucherbook;package=com.voucherbook.app;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.voucherbook.app;end';
      }
    }
    
    // Auto-redirect on page load (optional)
    // detectAndRedirect();
  </script>
</body>
</html>
```

## API Integration Points

### Backend Endpoints (Already Available)
- **Voucher Details**: `GET /vouchers/:id` - Get voucher information
- **Scan Tracking**: `POST /vouchers/:id/scan` - Track QR scan with location/device info
- **Claim Voucher**: `POST /vouchers/:id/claim` - Claim voucher to user wallet
- **Redeem Voucher**: `POST /vouchers/:id/redeem` - Redeem voucher with validation

### New Endpoints Needed
```typescript
// GET /vouchers/:id/deep-link - Generate deep link for voucher
// POST /analytics/deep-link-open - Track deep link opens
// GET /vouchers/:id/preview - Get voucher preview for web fallback
```

## Marketing Attribution & Analytics

### Tracking Parameters
- **`source`**: `qr`, `share`, `web`, `email`, `social`
- **`medium`**: `print`, `digital`, `mobile`, `desktop`  
- **`campaign`**: `summer2024`, `launch`, `referral`
- **`content`**: A/B test variations

### Analytics Events
```typescript
interface DeepLinkAnalytics {
  event: 'deep_link_open' | 'voucher_view' | 'app_install_prompt';
  voucherId: string;
  source?: string;
  campaign?: string;
  platform: 'ios' | 'android' | 'web';
  appInstalled: boolean;
  timestamp: Date;
  userAgent: string;
  location?: { lat: number; lng: number };
}
```

## Security Considerations

### Existing JWT Security (Maintained)
- ECDSA signature validation
- Expiration checks
- Nonce verification
- Rate limiting

### Additional Deep Link Security
- **URL validation**: Validate voucherId format and existence
- **Rate limiting**: Prevent deep link spam
- **Referrer checking**: Track legitimate vs. suspicious sources  
- **User agent validation**: Detect bot traffic

## Technical Benefits

### User Experience
✅ **One-tap voucher access**: QR scan → App opens to specific voucher
✅ **Smart installation**: Seamless app store redirect if not installed  
✅ **Cross-platform compatibility**: Works on iOS, Android, and web
✅ **Offline resilience**: QR codes work even when initially offline

### Marketing & Analytics  
✅ **Attribution tracking**: Know which QR codes drive installs/engagement
✅ **Campaign performance**: Track print vs digital voucher effectiveness
✅ **User journey insights**: Understand scan-to-redemption flow
✅ **A/B testing support**: Test different QR designs and messaging

### Technical Architecture
✅ **SEO-friendly**: Web fallback pages are indexable
✅ **Social sharing**: Universal links work in messaging apps  
✅ **Backward compatible**: Existing JWT system continues to work
✅ **Scalable**: Works with existing backend infrastructure

## Implementation Timeline

### Week 1: Foundation
- [ ] Configure URL schemes (iOS/Android)
- [ ] Set up basic deep link handling in Flutter
- [ ] Create web fallback page template
- [ ] Test basic deep link flow

### Week 2: Backend Integration  
- [ ] Enhance VoucherQRService with deep link generation
- [ ] Add analytics tracking endpoints
- [ ] Update QR generation to use universal links
- [ ] Test with existing voucher endpoints

### Week 3: Universal Links
- [ ] Set up domain and SSL certificates
- [ ] Configure Apple App Site Association
- [ ] Set up Android App Links
- [ ] Test universal link validation

### Week 4: Analytics & Polish
- [ ] Implement comprehensive analytics tracking
- [ ] Add marketing attribution support
- [ ] Optimize web fallback page performance
- [ ] Conduct cross-platform testing

### Week 5: Launch Preparation
- [ ] Load testing with high QR scan volume
- [ ] Security audit of deep link handling
- [ ] Documentation and training materials
- [ ] Gradual rollout plan

## Success Metrics

### Key Performance Indicators
- **App Install Rate**: % of QR scans that lead to app installs
- **Deep Link Success Rate**: % of deep links that successfully open vouchers  
- **Voucher Conversion**: % of QR scans that result in voucher claims/redemptions
- **Attribution Accuracy**: Quality of marketing attribution data

### Target Goals
- 📈 **25%+ install rate** from QR scans by non-app users
- 📈 **90%+ deep link success rate** for existing app users
- 📈 **40%+ voucher claim rate** within 24 hours of QR scan
- 📈 **95%+ attribution accuracy** for marketing campaigns

## Next Steps

1. **Add URL schemes** to iOS/Android app configurations
2. **Create basic deep link handler** using uni_links package  
3. **Set up simple web fallback page** for testing
4. **Enhance backend QR service** with universal link generation
5. **Test end-to-end flow** with a few sample vouchers
6. **Implement analytics tracking** for optimization insights
7. **Configure Universal Links** for production deployment

This comprehensive strategy transforms your QR codes from simple JWT tokens into powerful marketing and user acquisition tools while maintaining the security and functionality of your existing voucher system.