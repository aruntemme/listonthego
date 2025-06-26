#!/bin/bash

# ListOnTheGo Android Build Script
echo "🚀 Building ListOnTheGo Android App..."

# Set environment variables
export ANDROID_HOME=~/Library/Android/sdk
export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# Build the Android app
cargo tauri android build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📱 APK file location:"
    echo "   src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
    echo ""
    echo "📦 AAB file location:"
    echo "   src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab"
    echo ""
    echo "📋 To install on device:"
    echo "   adb install src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
else
    echo "❌ Build failed!"
    exit 1
fi 