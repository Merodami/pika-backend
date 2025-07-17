# iOS Development Setup Guide for Pika Flutter App

This guide provides comprehensive instructions for setting up iOS development for the Pika Flutter application on macOS. iOS development is already working in this project, and this guide documents the complete setup process.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Xcode Installation and Configuration](#xcode-installation-and-configuration)
3. [iOS Simulator Setup](#ios-simulator-setup)
4. [Physical Device Setup](#physical-device-setup)
5. [CocoaPods Configuration](#cocoapods-configuration)
6. [Firebase iOS Configuration](#firebase-ios-configuration)
7. [Running the App](#running-the-app)
8. [Common Issues and Solutions](#common-issues-and-solutions)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- macOS (required for iOS development)
- Flutter 3.32.1+ installed
- Apple Developer Account (free or paid)
- Xcode 15.0+ (latest stable version)
- Homebrew installed

## Xcode Installation and Configuration

### 1. Install Xcode

Download and install Xcode from the Mac App Store or Apple Developer portal:

```bash
# Install via command line (requires logged-in Apple ID)
xcode-select --install

# Or download from Mac App Store
open "macappstore://itunes.apple.com/app/xcode/id497799835"
```

### 2. Accept Xcode License

```bash
sudo xcodebuild -license accept
```

### 3. Install Additional iOS Simulators (Optional)

Open Xcode and navigate to:

1. **Xcode > Settings** (or **Preferences**)
2. **Platforms** tab
3. **iOS** section
4. **Download** additional simulators as needed

### 4. Configure Command Line Tools

```bash
# Set active developer directory
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Verify installation
xcode-select -p
```

## iOS Simulator Setup

### 1. List Available Simulators

```bash
# List all available simulators
xcrun simctl list devices

# List only booted simulators
xcrun simctl list devices | grep "Booted"
```

### 2. Boot a Simulator

```bash
# Boot iPhone 15 Pro simulator (example)
xcrun simctl boot "iPhone 15 Pro"

# Or open Simulator app and choose device
open -a Simulator
```

### 3. Recommended Simulators for Testing

- **iPhone 15 Pro**: Latest flagship device simulation
- **iPhone SE (3rd generation)**: Smaller screen testing
- **iPad Pro (12.9-inch)**: Tablet layout testing

## Physical Device Setup

### 1. Enable Developer Mode on iOS Device

For iOS 16+:

1. Connect device to Mac with USB cable
2. Open **Settings > Privacy & Security**
3. Scroll to **Developer Mode** and enable it
4. Restart device when prompted
5. Confirm enabling Developer Mode

### 2. Trust Computer and Developer Certificate

1. When connecting device, tap **Trust** on device screen
2. In Xcode, navigate to **Window > Devices and Simulators**
3. Select your device and click **Use for Development**
4. Sign in with Apple ID when prompted

### 3. Device Provisioning

```bash
# Verify device is detected
flutter devices

# Should show your device with identifier
```

## CocoaPods Configuration

### 1. Install CocoaPods

```bash
# Install CocoaPods via Homebrew (recommended)
brew install cocoapods

# Or install via RubyGems
sudo gem install cocoapods
```

### 2. Setup CocoaPods for Project

```bash
# Navigate to iOS directory
cd packages/frontend/flutter-app/ios

# Install pods (dependencies)
pod install

# If issues occur, try:
pod repo update
pod install --repo-update
```

### 3. Verify Podfile Configuration

The project's `ios/Podfile` should contain:

```ruby
# Minimum iOS version for Firebase compatibility
platform :ios, '12.0'

# CocoaPods analytics opt-out
ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}
```

## Firebase iOS Configuration

### 1. Firebase Project Setup

The Firebase configuration is already included in the project:

```
ios/
├── Runner/
│   ├── GoogleService-Info.plist  # Firebase configuration
│   └── Info.plist                # App configuration
└── Runner.xcworkspace             # Main workspace file
```

### 2. Verify Firebase Integration

Check that Firebase is properly configured:

```bash
# Navigate to app directory
cd packages/frontend/flutter-app

# Verify Firebase CLI configuration
firebase projects:list

# Check current Firebase project
firebase use
```

### 3. iOS-Specific Firebase Features

The app includes these Firebase features for iOS:

- **Firebase Auth**: Authentication with custom tokens
- **Cloud Firestore**: Real-time database
- **Firebase Messaging**: Push notifications with APNs
- **Firebase Storage**: File storage and retrieval

## Running the App

### 1. Run on iOS Simulator

```bash
# Navigate to app directory
cd packages/frontend/flutter-app

# List available devices
flutter devices

# Run on default iOS simulator
flutter run

# Run on specific simulator
flutter run -d "iPhone 15 Pro"

# Run with specific configuration
flutter run -d ios --dart-define=API_BASE_URL=http://localhost:8000/api/v1
```

### 2. Run on Physical Device

```bash
# Run on connected physical device
flutter run -d "Your-iPhone-Name"

# For Firebase emulator connectivity (using Mac's IP)
flutter run -d "Your-iPhone-Name" --dart-define=API_BASE_URL=http://[YOUR_MAC_IP]:8000/api/v1
```

### 3. Build for Testing

```bash
# Build iOS app without running
flutter build ios --debug

# Build for release (requires proper code signing)
flutter build ios --release
```

## Common Issues and Solutions

### Issue 1: Xcode Build Errors

**Error**: Various Xcode compilation errors

**Solution**:

```bash
# Clean Flutter build
flutter clean

# Clean iOS build
cd ios
rm -rf Pods/
rm Podfile.lock
pod install
cd ..

# Rebuild
flutter build ios --debug
```

### Issue 2: Code Signing Issues

**Error**: Code signing certificate problems

**Solution**:

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select **Runner** target
3. Go to **Signing & Capabilities**
4. Select your **Team** (Apple Developer Account)
5. Enable **Automatically manage signing**
6. Ensure **Bundle Identifier** is unique

### Issue 3: Firebase Configuration Missing

**Error**: Firebase not properly configured

**Solution**:

```bash
# Reconfigure Firebase for iOS
cd packages/frontend/flutter-app
flutterfire configure --platforms=ios

# Follow prompts to select Firebase project
# This will update GoogleService-Info.plist
```

### Issue 4: Pod Installation Failures

**Error**: CocoaPods dependency resolution errors

**Solution**:

```bash
# Navigate to iOS directory
cd ios

# Update CocoaPods repository
pod repo update

# Clean and reinstall
rm -rf Pods/
rm Podfile.lock
pod install

# If still failing, try:
pod install --repo-update --verbose
```

### Issue 5: iOS Version Compatibility

**Error**: Minimum iOS version conflicts

**Solution**:

Update `ios/Podfile`:

```ruby
# Set minimum iOS version
platform :ios, '12.0'

# Add to post_install hook if needed
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.0'
    end
  end
end
```

### Issue 6: Permission Issues

**Error**: App crashes due to missing permissions

**Solution**:

Check `ios/Runner/Info.plist` contains required permissions:

```xml
<!-- Camera access -->
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to upload photos</string>

<!-- Photo library access -->
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to select images</string>

<!-- Location access -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to find nearby services</string>

<!-- Microphone access (for video calls) -->
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for voice communication</string>
```

## Troubleshooting

### Debug Information

```bash
# Comprehensive Flutter doctor check for iOS
flutter doctor -v

# Check iOS-specific configuration
flutter doctor --verbose | grep -A 10 "iOS toolchain"

# List iOS devices and simulators
flutter devices

# Check Xcode installation
xcode-select -p
xcodebuild -version
```

### Firebase Emulator Connectivity

For physical device testing with Firebase emulators:

```bash
# Start Firebase emulators with network binding
firebase emulators:start --only firestore,auth --host 0.0.0.0

# Find your Mac's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Update Firebase configuration in app to use your Mac's IP address for emulator connectivity.

### Clean Development Environment

```bash
# Complete clean and rebuild
flutter clean
cd ios
rm -rf Pods/
rm Podfile.lock
rm -rf build/
cd ..
flutter pub get
cd ios
pod install
cd ..
flutter build ios --debug
```

### Hot Reload and Development

Once the app is running:

- `r` - Hot reload (preserves app state)
- `R` - Hot restart (resets app state)
- `q` - Quit debug session

## Environment Verification Checklist

Before iOS development, verify:

- [ ] Xcode is installed and updated
- [ ] iOS simulators are available
- [ ] CocoaPods is installed and working
- [ ] Firebase configuration files are present
- [ ] Apple Developer account is configured
- [ ] Code signing is set up correctly
- [ ] Required permissions are declared in Info.plist
- [ ] Flutter doctor shows no iOS-related issues

## Performance Considerations

### iOS-Specific Optimizations

- **Memory Management**: iOS has strict memory limits
- **Background Processing**: Limited background execution time
- **App Store Guidelines**: Follow iOS Human Interface Guidelines
- **Performance Monitoring**: Use Instruments for profiling

### Testing Recommendations

- Test on multiple iOS versions (12.0+)
- Test on different device sizes (iPhone SE to iPad Pro)
- Test network connectivity scenarios
- Test app backgrounding and foregrounding
- Verify push notification functionality

## Deployment Preparation

### App Store Connect Setup

For production deployment:

1. **Bundle Identifier**: Ensure unique bundle ID
2. **Code Signing**: Production certificates configured
3. **App Icons**: All required sizes included
4. **Privacy Manifest**: Required for App Store submission
5. **Build Configuration**: Release mode optimizations

### Build Commands

```bash
# Production build
flutter build ios --release

# Archive for App Store (via Xcode)
# Open ios/Runner.xcworkspace in Xcode
# Product > Archive
```

## 🔄 CocoaPods Maintenance (Important!)

### **How Often You'll Need Pod Install**

CocoaPods sync issues are **common during development**. Expect to run `pod install`:

- **New developers**: 2-3 times per week initially
- **Experienced developers**: Once every 1-2 weeks
- **Team projects**: More frequent due to dependency changes

### **When Pod Install is Required**

✅ **Always run pod install after:**

- Adding/removing Flutter dependencies (`flutter pub add`)
- Pulling code changes that modify `pubspec.yaml`
- Switching git branches with different dependencies
- Flutter SDK updates
- Firebase configuration changes
- When Xcode shows "sandbox not in sync" error
- After `flutter clean`

### **Standard Maintenance Process (5-10 minutes)**

```bash
# 1. Clean Flutter first (ALWAYS)
flutter clean

# 2. Get Flutter dependencies
flutter pub get

# 3. Navigate to iOS directory
cd ios

# 4. Install/update pods
pod install

# 5. Return to project root
cd ..

# 6. Test build
flutter run -d ios
```

### **For Persistent Issues (Nuclear Option)**

```bash
# Complete clean and rebuild
flutter clean
cd ios
rm -rf Pods/
rm Podfile.lock
pod repo update
pod install
cd ..
flutter pub get
flutter build ios --debug
```

### **Team Development Best Practices**

- ✅ **Always commit**: `ios/Podfile.lock`
- ❌ **Never commit**: `ios/Pods/`, `ios/.symlinks/`
- 🔄 **After git pull**: Check if `pubspec.yaml` changed → run `pod install`
- 📱 **Before building**: Verify `pod install` if build fails

## Additional Notes

### Compatibility

- **Minimum iOS**: 12.0 (required for Firebase features)
- **Recommended iOS**: 15.0+ for best experience
- **Device Support**: iPhone 6s and newer, iPad (5th gen) and newer

### Development Workflow

1. **Simulator First**: Use simulators for rapid development
2. **Physical Device Testing**: Test performance and device-specific features
3. **Multiple Devices**: Test on various screen sizes and iOS versions
4. **Release Testing**: Always test release builds before submission
5. **Pod Maintenance**: Include `pod install` in your regular workflow

---

**Note**: This iOS setup is production-ready and has been tested to work with the Pika Flutter application. The configuration supports all planned features including real-time chat, push notifications, and Firebase integration. CocoaPods maintenance is a normal part of Flutter iOS development.
