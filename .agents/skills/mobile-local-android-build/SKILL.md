---
name: mobile-local-android-build
description: >-
  Use this skill when building the Android APK for deviceops-mobile locally on the PC,
  troubleshooting Gradle/CMake/Kotlin issues in WSL2, or flashing the APK to a connected device via ADB.
---

# Local Android APK Build Runbook

## Overview
This skill guides the agent through building a release preview APK for `deviceops-mobile` locally inside WSL2 Ubuntu without using EAS cloud build queues, and deploying it to a physical Android device via Windows ADB.

## Prerequisites & Environment
- **Java**: Java 17 OpenJDK (`/usr/lib/jvm/java-17-openjdk-amd64`)
- **Android SDK**: `/home/usama/Android/Sdk`
- **NDK**: `/home/usama/Android/Sdk/ndk/27.1.12297006`
- **CMake**: `/home/usama/Android/Sdk/cmake/3.22.1`
- **Node**: v22.16.0 via NVM

## Step-by-Step Procedure

### Step 1: Verify Dependencies
Inside `deviceops-mobile`:
```bash
npm run verify
```
If errors appear regarding mismatched packages, run:
```bash
npx expo install --check
```

### Step 2: Execute Local Build
Run the prepared build script inside WSL:
```bash
cd /home/usama/Work/personal/deviceops/deviceops-mobile
./build-apk.sh
```
*Note: The script exports `EAS_SKIP_AUTO_FINGERPRINT=1` and required SDK/NDK/CMake paths, outputting to `./build/deviceops-preview.apk`.*

### Step 3: Verify Output APK
Confirm the output exists and is non-empty:
```powershell
Get-Item 'w:\home\usama\Work\personal\deviceops\deviceops-mobile\build\deviceops-preview.apk'
```

### Step 4: Install to Connected Android Device
From Windows PowerShell:
1. List attached devices:
   ```powershell
   adb devices
   ```
2. Install the APK:
   ```powershell
   adb -s <DEVICE_ID> install -r "W:\home\usama\Work\personal\deviceops\deviceops-mobile\build\deviceops-preview.apk"
   ```
3. Launch the application:
   ```powershell
   adb -s <DEVICE_ID> shell monkey -p com.deviceops.technician -c android.intent.category.LAUNCHER 1
   ```

## Common Issues & Troubleshooting
- **Build Stuck on CMake**: Check if `/home/usama/Android/Sdk/cmake/3.22.1` exists and is in `PATH`. Gradle's downloader hangs if CMake is missing.
- **Kotlin Daemon Hang**: Verify `~/.gradle/gradle.properties` has `kotlin.compiler.execution.strategy=in-process`.
