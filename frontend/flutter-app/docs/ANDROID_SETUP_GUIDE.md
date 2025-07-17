# Android Development Setup Guide for Pika Flutter App

This guide provides step-by-step instructions to set up Android development for the Pika Flutter application on macOS, based on real-world troubleshooting experience.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Android Studio Installation](#android-studio-installation)
3. [Flutter Configuration](#flutter-configuration)
4. [Common Issues and Solutions](#common-issues-and-solutions)
5. [Running the App](#running-the-app)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- macOS (this guide is macOS-specific)
- Homebrew installed
- Flutter 3.32.1+ installed
- Physical Android device for testing
- Xcode installed (for iOS development compatibility)

## Android Studio Installation

### 1. Install Android Studio

```bash
brew install --cask android-studio
```

### 2. Initial Android Studio Setup

1. **Launch Android Studio**
2. **Complete the setup wizard** - this will download the Android SDK
3. **Accept all licenses** when prompted
4. **Install recommended components** including:
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android Emulator (optional)
   - Android SDK Command-line Tools

### 3. Install Command Line Tools

1. Open **Android Studio > Settings** (or **Preferences**)
2. Navigate to **Appearance & Behavior > System Settings > Android SDK**
3. Click **SDK Tools** tab
4. Check **Android SDK Command-line Tools (latest)**
5. Click **Apply** and install

## Flutter Configuration

### 1. Configure Flutter to Use Android Studio SDK

```bash
# Set Flutter to use Android Studio's SDK
flutter config --android-sdk ~/Library/Android/sdk

# Verify configuration
flutter doctor -v
```

### 2. Accept Android Licenses

```bash
# Accept all Android SDK licenses
flutter doctor --android-licenses
```

When prompted, type `y` and press Enter for each license.

### 3. Set Environment Variables

Add these lines to your `~/.zshrc` file:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk

# Add Android tools to PATH
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload your shell:

```bash
source ~/.zshrc
```

### 4. Verify Setup

```bash
# Check Flutter configuration
flutter doctor

# Verify ADB version
adb --version

# Should show version 1.0.41 or higher
```

## Common Issues and Solutions

### Issue 1: ADB Version Mismatch

**Error**: `adb server version (40) doesn't match this client (41); killing...`

**Root Cause**: Multiple ADB installations or third-party apps with embedded ADB.

**Solution**:

1. **Find conflicting ADB processes**:

   ```bash
   ps aux | grep -i adb
   ```

2. **Check which ADB binary is running**:

   ```bash
   lsof -p [PID] | grep adb
   ```

3. **Common culprits**:

   - Splashtop XDisplay: `/Applications/Splashtop XDisplay.app/Contents/MacOS/adb`
   - Genymotion
   - Unity installations
   - Old Android SDK installations

4. **Disable conflicting ADB**:

   ```bash
   # Example for Splashtop XDisplay
   sudo mv "/Applications/Splashtop XDisplay.app/Contents/MacOS/adb" "/Applications/Splashtop XDisplay.app/Contents/MacOS/adb.disabled"
   ```

5. **Kill old ADB processes**:
   ```bash
   adb kill-server
   ```

### Issue 2: NDK Version Conflicts

**Error**: Plugin requires different Android NDK version

**Solution**:

1. **Update `android/app/build.gradle.kts`**:
   ```kotlin
   android {
       ndkVersion = "27.0.12077973"
       // ... other configurations
   }
   ```

### Issue 3: Core Library Desugaring Required

**Error**: Dependency requires core library desugaring

**Solution**:

1. **Enable desugaring in `android/app/build.gradle.kts`**:

   ```kotlin
   android {
       compileOptions {
           sourceCompatibility = JavaVersion.VERSION_11
           targetCompatibility = JavaVersion.VERSION_11
           isCoreLibraryDesugaringEnabled = true
       }
   }

   dependencies {
       coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
   }
   ```

### Issue 4: MinSDK Version Conflicts

**Error**: Plugin requires higher minSdk version

**Solution**:

1. **Update `android/app/build.gradle.kts`**:
   ```kotlin
   defaultConfig {
       minSdk = 23  // Required for Firebase Auth
       // ... other configurations
   }
   ```

## Running the App

### 1. Connect Android Device

1. **Enable Developer Options** on your Android device:

   - Go to **Settings > About phone**
   - Tap **Build number** 7 times
   - Developer options will appear in Settings

2. **Enable USB Debugging**:

   - Go to **Settings > Developer options**
   - Enable **USB debugging**
   - Enable **Install via USB** (if available)

3. **Connect via USB** and accept the debugging dialog on your device

### 2. Verify Device Connection

```bash
adb devices
```

Your device should appear as `device` (not `offline` or `unauthorized`).

### 3. Run the Flutter App

```bash
# Navigate to the Flutter app directory
cd packages/frontend/flutter-app

# Run the app with Firebase emulator configuration
flutter run -d [DEVICE_ID] --dart-define=API_BASE_URL=http://[YOUR_MAC_IP]:8000/api/v1
```

**Note**: Replace `[DEVICE_ID]` with your device ID from `adb devices` and `[YOUR_MAC_IP]` with your Mac's IP address for Firebase emulator connectivity.

## Troubleshooting

### Debug Information

```bash
# Comprehensive Flutter doctor check
flutter doctor -v

# Check connected devices
flutter devices

# Check ADB status
adb devices

# Kill and restart ADB if needed
adb kill-server && adb start-server
```

### Clean Build

If you encounter build issues:

```bash
# Clean Flutter build
flutter clean

# Get dependencies
flutter pub get

# Rebuild
flutter build apk --debug
```

### Firebase Emulator Setup

Ensure Firebase emulators are running on your Mac:

```bash
# From the project root
firebase emulators:start
```

The app is configured to connect to emulators at your Mac's IP address for physical device testing.

## Environment Verification Checklist

Before development, verify:

- [ ] `flutter doctor` shows no critical issues
- [ ] Android Studio is installed and configured
- [ ] Android SDK command-line tools are installed
- [ ] Environment variables are set correctly
- [ ] No conflicting ADB installations
- [ ] Android device is connected and authorized
- [ ] Firebase emulators are accessible from device

## Additional Notes

### iOS Development

This setup is compatible with existing iOS development. The toolchains are completely separate.

### Hot Reload

Once the app is running, you can use:

- `r` - Hot reload
- `R` - Hot restart
- `q` - Quit

### Performance

- Use physical devices for testing instead of emulators when possible
- Enable GPU rendering for better performance
- Monitor console output for performance warnings

---

**Troubleshooting Tips**: If you encounter issues not covered here, check running processes (`ps aux | grep adb`) and ensure no third-party applications are interfering with ADB.
