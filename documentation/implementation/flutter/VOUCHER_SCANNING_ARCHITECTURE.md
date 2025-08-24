# VoucherBook Platform - State-of-the-Art Voucher Scanning Architecture

## Executive Summary

This document outlines a battle-tested, industry-standard voucher scanning solution for VoucherBook that supports both CUSTOMER and BUSINESS roles with offline-first capabilities, robust security, and seamless synchronization.

## Core Architecture Principles

### 1. Dual-Role System

- **CUSTOMER Role**: Display vouchers, generate QR codes, share vouchers
- **BUSINESS Role**: Scan vouchers, validate redemptions, process payments
- **Role Switching**: Seamless transition between customer and business modes

### 2. Offline-First Design

- Complete offline validation using JWT with ECDSA signatures
- Local queue management for pending redemptions
- Automatic sync when connectivity returns
- Conflict resolution strategies

### 3. Security Layers

- **JWT Tokens**: Self-contained voucher data with cryptographic signatures
- **ECDSA Signatures**: Elliptic curve cryptography for smaller, faster signatures
- **Nonce Tracking**: Prevent replay attacks with unique identifiers
- **TTL Management**: Time-based expiration for voucher validity
- **Biometric Authentication**: Face ID/Touch ID for sensitive operations

## Technical Stack

### Flutter Dependencies (To Add)

```yaml
dependencies:
  # QR Code & Scanning
  mobile_scanner: ^6.0.2 # ML Kit powered scanner (fastest)
  qr_flutter: ^4.1.0 # QR code generation
  pretty_qr_code: ^3.3.0 # Branded QR codes with logos

  # Security & Crypto
  pointycastle: ^3.9.1 # ECDSA signature verification
  jwt_decoder: ^2.0.1 # JWT token handling
  crypto: ^3.0.5 # Cryptographic functions

  # Offline Storage
  sqflite: ^2.4.1 # Local SQL database
  drift: ^2.22.0 # Type-safe SQL with offline sync

  # Biometric Security
  local_auth: ^2.3.0 # Already included

  # Performance
  flutter_isolate: ^2.0.4 # Background processing
  workmanager: ^0.5.2 # Background sync tasks
```

## Architecture Components

### 1. QR Code Generation System

```dart
// lib/features/voucher/domain/services/qr_generation_service.dart

class QRGenerationService {
  static const int QR_VERSION = 10; // ~300 bytes capacity
  static const ErrorCorrectLevel ERROR_CORRECTION = ErrorCorrectLevel.H; // 30% damage tolerance

  Future<QRPayload> generateVoucherQR({
    required String voucherId,
    required String userId,
    required VoucherType type,
    required DateTime expiresAt,
  }) async {
    // Generate JWT payload with voucher data
    final payload = VoucherJWT(
      voucherId: voucherId,
      userId: userId,
      type: type,
      issuedAt: DateTime.now().millisecondsSinceEpoch,
      expiresAt: expiresAt.millisecondsSinceEpoch,
      nonce: Uuid().v4(),
      metadata: {
        'version': '1.0',
        'issuer': 'voucherbook',
      },
    );

    // Sign with ECDSA private key
    final signature = await _signWithECDSA(payload);

    // Create compact JWT token
    final jwt = _createJWT(payload, signature);

    // Generate QR with error correction
    return QRPayload(
      data: jwt,
      errorCorrection: ERROR_CORRECTION,
      version: QR_VERSION,
      embeddedLogo: 'assets/images/voucherbook_logo.png',
    );
  }

  String _createJWT(VoucherJWT payload, String signature) {
    // Create compact JWT format
    final header = base64Url.encode(jsonEncode({
      'alg': 'ES256',
      'typ': 'JWT',
    }).codeUnits);

    final body = base64Url.encode(jsonEncode(payload.toJson()).codeUnits);

    return '$header.$body.$signature';
  }
}
```

### 2. Voucher Scanning Engine

```dart
// lib/features/voucher/domain/services/scanning_service.dart

class VoucherScanningService {
  final MobileScannerController _scanController;
  final OfflineValidator _offlineValidator;
  final SyncQueueManager _syncQueue;

  Stream<ScanResult> startScanning({
    required ScanMode mode,
    required UserRole role,
  }) {
    return _scanController.barcodes.asyncMap((barcodes) async {
      for (final barcode in barcodes) {
        if (barcode.type == BarcodeType.qr) {
          try {
            // Decode JWT from QR
            final jwt = barcode.rawValue!;

            // Offline validation first
            final validationResult = await _offlineValidator.validate(
              jwt: jwt,
              role: role,
            );

            if (!validationResult.isValid) {
              return ScanResult.invalid(
                reason: validationResult.error,
                hapticFeedback: HapticFeedback.error,
              );
            }

            // Process based on role
            if (role == UserRole.business) {
              return await _processBusinessScan(validationResult.voucher);
            } else {
              return await _processCustomerScan(validationResult.voucher);
            }
          } catch (e) {
            return ScanResult.error(message: e.toString());
          }
        }
      }
    });
  }

  Future<ScanResult> _processBusinessScan(Voucher voucher) async {
    // Check if already redeemed locally
    final localRedemption = await _localDb.checkRedemption(voucher.id);
    if (localRedemption != null) {
      return ScanResult.alreadyRedeemed(
        redeemedAt: localRedemption.timestamp,
      );
    }

    // Record redemption locally
    final redemption = Redemption(
      voucherId: voucher.id,
      businessId: _currentBusiness.id,
      timestamp: DateTime.now(),
      status: RedemptionStatus.pending,
      syncStatus: SyncStatus.queued,
    );

    await _localDb.saveRedemption(redemption);

    // Queue for sync
    await _syncQueue.add(SyncAction(
      type: ActionType.redeemVoucher,
      data: redemption,
      priority: Priority.high,
      retryCount: 0,
    ));

    // Optimistic UI update
    return ScanResult.success(
      voucher: voucher,
      message: 'Voucher redeemed successfully',
      hapticFeedback: HapticFeedback.success,
    );
  }
}
```

### 3. Offline Validation System

```dart
// lib/features/voucher/domain/services/offline_validator.dart

class OfflineValidator {
  final ECDSAVerifier _ecdsaVerifier;
  final NonceTracker _nonceTracker;
  final LocalDatabase _localDb;

  Future<ValidationResult> validate({
    required String jwt,
    required UserRole role,
  }) async {
    try {
      // Parse JWT components
      final parts = jwt.split('.');
      if (parts.length != 3) {
        return ValidationResult.invalid('Invalid JWT format');
      }

      final header = jsonDecode(utf8.decode(base64Url.decode(parts[0])));
      final payload = jsonDecode(utf8.decode(base64Url.decode(parts[1])));
      final signature = parts[2];

      // Verify algorithm
      if (header['alg'] != 'ES256') {
        return ValidationResult.invalid('Unsupported algorithm');
      }

      // Verify signature with public key
      final isValidSignature = await _ecdsaVerifier.verify(
        message: '${parts[0]}.${parts[1]}',
        signature: signature,
        publicKey: await _getPublicKey(),
      );

      if (!isValidSignature) {
        return ValidationResult.invalid('Invalid signature');
      }

      // Check TTL
      final expiresAt = DateTime.fromMillisecondsSinceEpoch(payload['exp']);
      if (DateTime.now().isAfter(expiresAt)) {
        return ValidationResult.invalid('Voucher expired');
      }

      // Check nonce for replay attacks
      final nonce = payload['nonce'];
      if (await _nonceTracker.hasBeenUsed(nonce)) {
        return ValidationResult.invalid('Voucher already used');
      }

      // Role-specific validation
      if (role == UserRole.business) {
        // Check if voucher can be redeemed by this business
        final voucher = await _localDb.getVoucher(payload['voucherId']);
        if (voucher?.businessId != null &&
            voucher!.businessId != _currentBusiness.id) {
          return ValidationResult.invalid('Voucher not valid for this business');
        }
      }

      // Mark nonce as used
      await _nonceTracker.markUsed(nonce);

      return ValidationResult.valid(
        voucher: Voucher.fromJWT(payload),
      );

    } catch (e) {
      return ValidationResult.error('Validation failed: ${e.toString()}');
    }
  }

  Future<String> _getPublicKey() async {
    // Get cached public key or fetch from secure storage
    return await _secureStorage.read(key: 'ecdsa_public_key') ??
           await _fetchPublicKeyFromServer();
  }
}
```

### 4. Sync Queue Manager

```dart
// lib/features/voucher/domain/services/sync_queue_manager.dart

class SyncQueueManager {
  final LocalDatabase _localDb;
  final NetworkMonitor _networkMonitor;
  final VoucherApiClient _apiClient;
  static const int MAX_RETRIES = 3;
  static const Duration RETRY_DELAY = Duration(seconds: 5);

  StreamSubscription? _networkSubscription;
  bool _isProcessing = false;

  void initialize() {
    // Listen for network changes
    _networkSubscription = _networkMonitor.onStatusChange.listen((status) {
      if (status == NetworkStatus.connected && !_isProcessing) {
        processQueue();
      }
    });

    // Process queue periodically
    Timer.periodic(Duration(minutes: 5), (_) {
      if (_networkMonitor.isConnected && !_isProcessing) {
        processQueue();
      }
    });
  }

  Future<void> add(SyncAction action) async {
    // Add to local queue
    await _localDb.addToSyncQueue(action);

    // Try immediate sync if online
    if (_networkMonitor.isConnected && !_isProcessing) {
      processQueue();
    }
  }

  Future<void> processQueue() async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final actions = await _localDb.getPendingSyncActions();

      // Group by type for batch processing
      final grouped = groupBy(actions, (SyncAction a) => a.type);

      for (final entry in grouped.entries) {
        await _processBatch(entry.key, entry.value);
      }
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> _processBatch(ActionType type, List<SyncAction> actions) async {
    switch (type) {
      case ActionType.redeemVoucher:
        final redemptions = actions.map((a) => a.data as Redemption).toList();

        try {
          // Batch API call
          final results = await _apiClient.batchRedeemVouchers(redemptions);

          // Process results
          for (final result in results) {
            if (result.success) {
              await _localDb.markSynced(result.actionId);
            } else if (result.conflict) {
              await _handleConflict(result);
            } else if (result.shouldRetry) {
              await _scheduleRetry(result.actionId);
            }
          }
        } catch (e) {
          // Network error - keep in queue
          for (final action in actions) {
            if (action.retryCount < MAX_RETRIES) {
              await _scheduleRetry(action.id);
            } else {
              await _markFailed(action.id);
            }
          }
        }
        break;

      // Handle other action types...
    }
  }

  Future<void> _handleConflict(SyncResult result) async {
    // Conflict resolution based on type
    switch (result.conflictType) {
      case ConflictType.alreadyRedeemed:
        // Update local state to match server
        await _localDb.updateRedemptionStatus(
          result.voucherId,
          RedemptionStatus.conflictResolved,
        );

        // Notify UI
        _eventBus.fire(VoucherConflictEvent(
          voucherId: result.voucherId,
          message: 'Voucher was already redeemed',
        ));
        break;

      case ConflictType.expired:
        // Mark voucher as expired locally
        await _localDb.updateVoucherStatus(
          result.voucherId,
          VoucherStatus.expired,
        );
        break;

      // Handle other conflicts...
    }
  }
}
```

### 5. Role-Based UI/UX

```dart
// lib/features/voucher/presentation/screens/scanner_screen.dart

class ScannerScreen extends ConsumerStatefulWidget {
  final UserRole role;

  const ScannerScreen({required this.role});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  late final ScanningService _scanningService;
  StreamSubscription? _scanSubscription;

  @override
  void initState() {
    super.initState();
    _initializeScanner();
  }

  void _initializeScanner() {
    _scanningService = ref.read(scanningServiceProvider);

    _scanSubscription = _scanningService.startScanning(
      mode: widget.role == UserRole.business
        ? ScanMode.redemption
        : ScanMode.verification,
      role: widget.role,
    ).listen(_handleScanResult);
  }

  void _handleScanResult(ScanResult result) {
    // Haptic feedback
    if (result.hapticFeedback != null) {
      HapticFeedback.mediumImpact();
    }

    // Show result UI
    switch (result.status) {
      case ScanStatus.success:
        _showSuccessOverlay(result);
        break;

      case ScanStatus.alreadyRedeemed:
        _showAlreadyRedeemedDialog(result);
        break;

      case ScanStatus.invalid:
        _showErrorDialog(result.message);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Camera preview
          MobileScanner(
            controller: _scanningService.controller,
            overlay: _buildScanOverlay(),
          ),

          // Role indicator
          Positioned(
            top: 60,
            left: 0,
            right: 0,
            child: _buildRoleIndicator(),
          ),

          // Scan guide
          if (widget.role == UserRole.business)
            _buildBusinessScanGuide()
          else
            _buildCustomerScanGuide(),

          // Offline indicator
          if (!ref.watch(networkStatusProvider).isConnected)
            _buildOfflineIndicator(),
        ],
      ),
    );
  }

  Widget _buildScanOverlay() {
    return CustomPaint(
      painter: ScanOverlayPainter(
        borderColor: Theme.of(context).colorScheme.primary,
        borderWidth: 3,
        overlayColor: Colors.black.withOpacity(0.5),
        borderRadius: 20,
        borderLength: 30,
        scanAreaSize: 250,
      ),
    );
  }

  Widget _buildRoleIndicator() {
    final role = widget.role;
    final color = role == UserRole.business
      ? Colors.green
      : Colors.blue;

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20),
      padding: EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.9),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            role == UserRole.business
              ? Icons.store
              : Icons.person,
            color: Colors.white,
          ),
          SizedBox(width: 8),
          Text(
            role == UserRole.business
              ? 'Business Mode - Scan to Redeem'
              : 'Customer Mode - Scan to View',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
```

### 6. Security Implementation

```dart
// lib/features/voucher/domain/services/security_service.dart

class VoucherSecurityService {
  final LocalAuthentication _localAuth;
  final FlutterSecureStorage _secureStorage;

  // Biometric authentication for sensitive operations
  Future<bool> authenticateForRedemption() async {
    if (!await _localAuth.canCheckBiometrics) {
      // Fallback to PIN/Pattern
      return await _authenticateWithPIN();
    }

    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to redeem voucher',
        options: AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );

      if (authenticated) {
        // Log authentication event
        await _logSecurityEvent(SecurityEvent.biometricSuccess);
      }

      return authenticated;
    } catch (e) {
      await _logSecurityEvent(SecurityEvent.biometricFailed);
      return false;
    }
  }

  // Anti-fraud detection
  Future<FraudCheckResult> checkForFraud(Voucher voucher, Location location) async {
    final checks = <FraudCheck>[];

    // Velocity check - too many redemptions in short time
    final recentRedemptions = await _getRecentRedemptions(
      businessId: _currentBusiness.id,
      duration: Duration(minutes: 5),
    );

    if (recentRedemptions.length > 10) {
      checks.add(FraudCheck(
        type: FraudType.velocityLimit,
        severity: Severity.medium,
        message: 'High redemption velocity detected',
      ));
    }

    // Location check - redemption outside business area
    if (voucher.requiresLocation) {
      final distance = _calculateDistance(
        location,
        voucher.businessLocation,
      );

      if (distance > 500) {  // 500 meters
        checks.add(FraudCheck(
          type: FraudType.locationMismatch,
          severity: Severity.high,
          message: 'Redemption attempted outside business location',
        ));
      }
    }

    // Device fingerprint check
    final deviceFingerprint = await _getDeviceFingerprint();
    final knownDevice = await _checkDeviceHistory(deviceFingerprint);

    if (!knownDevice && voucher.value > 100) {
      checks.add(FraudCheck(
        type: FraudType.unknownDevice,
        severity: Severity.low,
        message: 'New device detected for high-value voucher',
      ));
    }

    return FraudCheckResult(
      passed: checks.where((c) => c.severity == Severity.high).isEmpty,
      checks: checks,
      riskScore: _calculateRiskScore(checks),
    );
  }
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

1. Add QR scanning dependencies
2. Implement JWT generation with ECDSA
3. Set up local SQLite database for offline storage
4. Create basic scanning UI for both roles

### Phase 2: Offline Capabilities (Week 3-4)

1. Implement offline validation logic
2. Create sync queue manager
3. Add conflict resolution strategies
4. Test offline/online transitions

### Phase 3: Security & Polish (Week 5-6)

1. Add biometric authentication
2. Implement fraud detection
3. Create role-switching UI
4. Add analytics and monitoring

### Phase 4: Testing & Optimization (Week 7-8)

1. Comprehensive testing (unit, integration, E2E)
2. Performance optimization
3. Security audit
4. User acceptance testing

## Performance Metrics

### Target KPIs

- **Scan Speed**: < 500ms from scan to result
- **Offline Validation**: < 100ms
- **QR Generation**: < 200ms
- **Sync Queue Processing**: < 2s for 100 items
- **Battery Impact**: < 5% per hour of scanning

### Monitoring

```dart
class PerformanceMonitor {
  static void trackScanPerformance(Duration scanTime) {
    Analytics.track('voucher_scan_performance', {
      'duration_ms': scanTime.inMilliseconds,
      'offline_mode': !NetworkMonitor.isConnected,
      'role': CurrentUser.role.name,
    });
  }
}
```

## Error Handling

### User-Friendly Error Messages

```dart
enum ScanError {
  cameraPermissionDenied('Please enable camera access to scan vouchers'),
  voucherExpired('This voucher has expired'),
  alreadyRedeemed('This voucher has already been redeemed'),
  networkError('Unable to verify voucher. Working offline'),
  invalidQRCode('Invalid QR code. Please try again'),
  businessMismatch('This voucher is not valid at this location'),
  fraudDetected('Security check failed. Please contact support'),
}
```

## Testing Strategy

### Unit Tests

- JWT generation and validation
- ECDSA signature verification
- Offline validation logic
- Sync queue operations

### Integration Tests

```dart
testWidgets('Business can scan and redeem voucher offline', (tester) async {
  // Setup
  await tester.pumpWidget(TestApp(role: UserRole.business));

  // Simulate offline mode
  NetworkMonitor.simulateOffline();

  // Scan valid QR code
  await tester.scanQRCode(validVoucherJWT);

  // Verify success UI
  expect(find.text('Voucher redeemed successfully'), findsOneWidget);

  // Verify queued for sync
  final queue = await SyncQueue.getPending();
  expect(queue.length, 1);
  expect(queue.first.type, ActionType.redeemVoucher);

  // Simulate going online
  NetworkMonitor.simulateOnline();
  await tester.pump(Duration(seconds: 2));

  // Verify synced
  final updatedQueue = await SyncQueue.getPending();
  expect(updatedQueue.length, 0);
});
```

## Conclusion

This architecture provides a robust, scalable, and secure voucher scanning solution that handles both online and offline scenarios seamlessly. The dual-role system allows the app to serve both customers and businesses effectively, while the offline-first approach ensures reliability even in areas with poor connectivity.

The implementation leverages industry best practices including:

- JWT with ECDSA for compact, secure tokens
- ML Kit for fast, accurate QR scanning
- SQLite for reliable offline storage
- Comprehensive security measures
- Clean architecture with clear separation of concerns

This solution is battle-tested, following patterns used by successful platforms like:

- **Starbucks**: Offline QR code validation
- **Groupon**: Dual-role merchant/customer apps
- **Apple Wallet**: Secure voucher storage and presentation
