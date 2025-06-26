# Android Development Guide 📱

This guide provides comprehensive instructions for setting up, building, and deploying the ListOnTheGo Android application using Tauri's mobile capabilities.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Environment Setup](#-environment-setup)
- [Project Initialization](#-project-initialization)
- [Building the App](#-building-the-app)
- [Testing & Deployment](#-testing--deployment)
- [Troubleshooting](#-troubleshooting)
- [Advanced Configuration](#-advanced-configuration)

## 🔧 Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows
- **Node.js**: v18 or higher
- **Rust**: Latest stable version
- **Java Development Kit**: JDK 17 or higher
- **Android Studio** or **Android Command Line Tools**

### Tool Installation

#### 1. Java Development Kit (JDK) 17+

**macOS (Homebrew):**
```bash
brew install openjdk@17
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

**Windows:**
Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://jdk.java.net/)

#### 2. Android Studio

**macOS:**
```bash
brew install android-studio
```

**Alternative - Command Line Tools Only:**
```bash
brew install android-commandlinetools
```

**Ubuntu/Debian:**
```bash
sudo snap install android-studio --classic
```

**Windows:**
Download from [Android Studio](https://developer.android.com/studio)

#### 3. Tauri CLI with Mobile Support

```bash
cargo install tauri-cli --version "^2.0"
```

## 🌍 Environment Setup

### Environment Variables

Add these to your shell profile (`~/.zshrc`, `~/.bashrc`, or `~/.profile`):

**macOS/Linux:**
```bash
# Java
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home  # macOS
# export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Linux
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# Android
export ANDROID_HOME=~/Library/Android/sdk  # macOS
# export ANDROID_HOME=~/Android/Sdk  # Linux
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools
```

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\25.2.9519653"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

### Reload Environment

**macOS/Linux:**
```bash
source ~/.zshrc  # or source ~/.bashrc
```

**Windows:**
Restart PowerShell or Command Prompt

## 📦 Project Initialization

### 1. Install Android NDK

```bash
# Using SDK Manager
$ANDROID_HOME/tools/bin/sdkmanager "ndk;25.2.9519653"

# Alternative: Install latest NDK
$ANDROID_HOME/tools/bin/sdkmanager "ndk-bundle"
```

### 2. Initialize Tauri Android Project

```bash
# Navigate to your project directory
cd listonthego

# Initialize Android support
cargo tauri android init
```

This will create:
- `src-tauri/gen/android/` - Android project files
- Android Gradle configuration
- Android manifest and resources
- Icon and asset directories

### 3. Verify Installation

```bash
# Check Android targets
cargo tauri android list-targets

# Check connected devices
adb devices
```

## 🏗️ Building the App

### Quick Build (Recommended)

Use the provided build script:

```bash
# Make executable (first time only)
chmod +x build-android.sh

# Build the app
./build-android.sh
```

### Manual Build Process

#### 1. Set Environment Variables

```bash
export ANDROID_HOME=~/Library/Android/sdk
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

#### 2. Build for Development

```bash
# Debug build (faster, for testing)
cargo tauri android dev

# Release build (optimized, for distribution)
cargo tauri android build
```

#### 3. Build for Specific Architecture

```bash
# ARM64 (most modern devices)
cargo tauri android build --target aarch64-linux-android

# ARM (older devices)
cargo tauri android build --target armv7-linux-androideabi

# x86_64 (emulators)
cargo tauri android build --target x86_64-linux-android

# Universal (all architectures)
cargo tauri android build --target universal
```

### Build Outputs

After a successful build:

**APK Files (for direct installation):**
```
src-tauri/gen/android/app/build/outputs/apk/
├── universal/release/app-universal-release-unsigned.apk
├── arm64-v8a/release/app-arm64-v8a-release-unsigned.apk
├── armeabi-v7a/release/app-armeabi-v7a-release-unsigned.apk
└── x86_64/release/app-x86_64-release-unsigned.apk
```

**AAB Files (for Google Play Store):**
```
src-tauri/gen/android/app/build/outputs/bundle/
├── universalRelease/app-universal-release.aab
├── arm64Release/app-arm64-release.aab
└── armv7Release/app-armv7-release.aab
```

## 📱 Testing & Deployment

### Testing on Device/Emulator

#### 1. Connect Device or Start Emulator

**Physical Device:**
1. Enable Developer Options
2. Enable USB Debugging
3. Connect via USB
4. Verify: `adb devices`

**Android Emulator:**
1. Open Android Studio
2. AVD Manager → Create Virtual Device
3. Start emulator
4. Verify: `adb devices`

#### 2. Install APK

```bash
# Install latest build
adb install src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk

# Install and replace existing
adb install -r path/to/app.apk

# Install to specific device (if multiple connected)
adb -s DEVICE_ID install path/to/app.apk
```

#### 3. Development with Live Reload

```bash
# Start development server with hot reload
cargo tauri android dev

# On specific device
cargo tauri android dev --device DEVICE_ID
```

### Signing for Release

#### 1. Generate Keystore

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Configure Gradle Signing

Edit `src-tauri/gen/android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('/path/to/my-release-key.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3. Build Signed APK

```bash
cargo tauri android build --release
```

### Publishing to Google Play Store

1. **Prepare AAB file**: Use the generated `.aab` file from build outputs
2. **Create Play Console Account**: [Google Play Console](https://play.google.com/console)
3. **Upload AAB**: Follow Play Console upload process
4. **Complete Store Listing**: Add descriptions, screenshots, etc.
5. **Submit for Review**: Google's review process typically takes 1-3 days

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures

**Error: "ANDROID_HOME not set"**
```bash
# Solution: Set environment variables
export ANDROID_HOME=~/Library/Android/sdk
source ~/.zshrc
```

**Error: "NDK not found"**
```bash
# Solution: Install NDK
$ANDROID_HOME/tools/bin/sdkmanager "ndk;25.2.9519653"
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
```

**Error: "Java version incompatible"**
```bash
# Solution: Use Java 17+
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
java -version
```

**Error: "OpenSSL linking failed"**
```toml
# Solution: Use rustls in Cargo.toml
[dependencies]
reqwest = { version = "0.11", features = ["json", "rustls-tls"], default-features = false }
```

#### 2. Device Connection Issues

**Device not detected:**
```bash
# Kill and restart adb server
adb kill-server
adb start-server
adb devices
```

**Permission denied:**
```bash
# On Linux, add user to plugdev group
sudo usermod -a -G plugdev $USER
# Logout and login again
```

#### 3. Gradle Build Issues

**Gradle sync failed:**
```bash
# Clean and rebuild
cd src-tauri/gen/android
./gradlew clean
./gradlew build
```

**Dependencies not found:**
```bash
# Update Gradle and dependencies
./gradlew wrapper --gradle-version=8.3
```

### Debug Information

#### Enable Verbose Logging

```bash
# Tauri debug logs
RUST_LOG=debug cargo tauri android build

# Android logcat (device logs)
adb logcat | grep "listonthego"
```

#### Check Build Configuration

```bash
# Verify Rust targets
rustup target list --installed

# Check Android build tools
$ANDROID_HOME/tools/bin/sdkmanager --list | grep "build-tools"
```

## ⚙️ Advanced Configuration

### Custom App Configuration

#### Android Manifest

Edit `src-tauri/gen/android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="ListOnTheGo"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme">
        
        <!-- Add permissions -->
        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
        
        <!-- Deep linking -->
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" android:host="listonthego.app" />
        </intent-filter>
    </application>
</manifest>
```

#### Customize Icons

Replace icons in:
```
src-tauri/gen/android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png     (48x48)
├── mipmap-hdpi/ic_launcher.png     (72x72)
├── mipmap-xhdpi/ic_launcher.png    (96x96)
├── mipmap-xxhdpi/ic_launcher.png   (144x144)
└── mipmap-xxxhdpi/ic_launcher.png  (192x192)
```

#### Configure Gradle

Edit `src-tauri/gen/android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.listonthego.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Performance Optimization

#### Reduce APK Size

```gradle
android {
    buildTypes {
        release {
            shrinkResources true
            minifyEnabled true
        }
    }
    
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}
```

#### Build Specific Architectures

```bash
# Target only ARM64 (most devices)
cargo tauri android build --target aarch64-linux-android

# Exclude x86 (reduces size)
cargo tauri android build --target universal --exclude x86_64-linux-android
```

## 📚 Additional Resources

### Official Documentation
- [Tauri Mobile Guide](https://tauri.app/v1/guides/building/mobile)
- [Android Developer Documentation](https://developer.android.com/docs)
- [Gradle Build Tool](https://gradle.org/guides/)

### Community Resources
- [Tauri Discord](https://discord.gg/tauri)
- [Android Developers Community](https://developer.android.com/community)
- [Stack Overflow - Tauri](https://stackoverflow.com/questions/tagged/tauri)

### Development Tools
- [Android Studio](https://developer.android.com/studio)
- [Visual Studio Code](https://code.visualstudio.com/) with Rust extensions
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)

---

**Happy Android Development! 🚀**

For questions or issues, please check the [troubleshooting section](#-troubleshooting) or create an issue in the repository. 