# Quick Troubleshooting Reference

## Common Flutter Android Issues - Quick Fixes

### 🔥 ADB Version Mismatch (Most Common)

**Error**: `adb server version (40) doesn't match this client (41); killing...`

**Quick Fix**:

```bash
# 1. Find the culprit
ps aux | grep -i adb
lsof -p [PID] | grep adb

# 2. Kill conflicting process
kill [PID]

# 3. Common culprits to check/disable:
# - Splashtop XDisplay
# - Genymotion
# - Unity installations
# - Old Android SDKs

# 4. Restart ADB
adb kill-server && adb start-server
```

### 🔧 Build Configuration Issues

**NDK Version Error**:

```kotlin
// android/app/build.gradle.kts
android {
    ndkVersion = "27.0.12077973"
}
```

**Desugaring Error**:

```kotlin
// android/app/build.gradle.kts
android {
    compileOptions {
        isCoreLibraryDesugaringEnabled = true
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
```

**MinSDK Error**:

```kotlin
// android/app/build.gradle.kts
defaultConfig {
    minSdk = 23
}
```

### 📱 Device Connection Issues

**Device Offline**:

```bash
# Disconnect/reconnect USB cable
# Or restart ADB
adb kill-server && adb start-server
```

**Device Unauthorized**:

- Check phone screen for USB debugging dialog
- Enable "Always allow from this computer"

### 🛠 Environment Setup

**Flutter Doctor Issues**:

```bash
# Fix Android SDK path
flutter config --android-sdk ~/Library/Android/sdk

# Accept licenses
flutter doctor --android-licenses

# Verify setup
flutter doctor -v
```

### 🔄 Clean Slate Approach

When all else fails:

```bash
# 1. Clean everything
flutter clean
adb kill-server

# 2. Close all development tools
# - Android Studio
# - Any emulators
# - Third-party Android tools

# 3. Restart fresh
adb start-server
flutter pub get
flutter run -d [DEVICE_ID]
```

### 📋 Pre-Development Checklist

- [ ] `adb devices` shows device as `device`
- [ ] `flutter doctor` has no critical errors
- [ ] No ADB version mismatch messages
- [ ] Firebase emulators running (if needed)
- [ ] All third-party Android tools closed

### 🆘 Emergency Commands

```bash
# Nuclear option - restart everything
adb kill-server
pkill -f "adb"
flutter clean
adb start-server

# Check what's running
ps aux | grep -i adb
flutter devices

# Environment check
echo $ANDROID_HOME
which adb
adb --version
```

---

**Remember**: 90% of Android development issues are caused by ADB version conflicts from third-party applications!
