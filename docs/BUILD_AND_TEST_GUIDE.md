# DeviceOps Mobile — Build & Fast Testing Guide

This guide covers the official, fastest ways to build and test **DeviceOps Mobile** without waiting in slow EAS cloud build queues.

---

## ⚡ Quick Comparison: Which Workflow Should You Use?

| Method | Speed | Requires APK Rebuild? | Zero Cloud Queue? | Best For |
| :--- | :---: | :---: | :---: | :--- |
| **1. Development Client (Recommended)** | **Instant (1 sec)** | **No** (Build once, stream code) | ✅ Yes | Daily UI & feature development |
| **2. Local EAS Build (`--local`)** | **~3–5 mins** | Yes (Generates standalone `.apk`) | ✅ Yes | Standalone `.apk` file without cloud queue |
| **3. Native CLI (`expo run:android`)** | **~2–4 mins** | Yes (Compiles via local Gradle) | ✅ Yes | USB-debugging on real device or emulator |
| **4. Android Studio GUI** | **~3–5 mins** | Yes (Visual Gradle build) | ✅ Yes | Profiling, Logcat, and visual inspection |
| **5. EAS Cloud Build (Free Tier)** | **30–60 mins** | Yes | ❌ No (Shared queue) | Automated CI/CD releases |

---

## 🚀 Method 1: Instant Testing via Development Client (Fastest)

`deviceops-mobile` has `expo-dev-client` installed. With development builds, **you build the native container APK only ONCE**. 

After the initial install, all your code changes (screens, components, hooks, styles) reload in **1 second over Wi-Fi** using Metro bundler—with zero compilation wait.

### Step 1: Install the Development Build APK on your phone
* **Option A (One-time cloud build):**  
  ```bash
  npx eas-cli build --platform android --profile development
  ```
  *(Install the resulting `.apk` on your phone once).*
* **Option B (One-time local build):**  
  ```bash
  npx eas-cli build --platform android --profile development --local
  ```

### Step 2: Start the development server
Whenever you want to test:
```bash
npx expo start
```
* Scan the QR code or select your device.
* Any changes you make in `app/` or `src/` will **hot-reload instantly (Fast Refresh)** on your phone!
* You only need a rebuild if you add a brand-new native library to `package.json`.

---

## 🛠️ Method 2: Local EAS Build (Bypass Cloud Queues)

If you want an installable standalone **`.apk` file** directly on your computer without waiting for the free tier queue:

### Prerequisites:
* Android SDK or Docker installed.
* Run from your project directory:

```bash
npx eas-cli build --platform android --profile preview --local
```

### Why this works:
* Our `eas.json` is configured with:
  ```json
  "preview": {
    "distribution": "internal",
    "android": {
      "buildType": "apk"
    }
  }
  ```
* The `--local` flag forces the build to run directly on your CPU/RAM using your local Android build tools, outputting a direct `application.apk` file.

---

## 💻 Method 3: Native Command-Line Build (`expo run:android`)

If you have Java (JDK 17+) and Android SDK installed:

1. Connect your Android phone to your PC via USB and enable **USB Debugging** (in Developer Options).
2. Run:
   ```bash
   npx expo run:android
   ```
3. Expo automatically prebuilds the native Android project and runs Gradle locally to install and launch the app directly onto your USB-connected phone.

---

## 📱 Method 4: Visual Build with Android Studio

If you install Android Studio and prefer building with the graphical interface:

### Step 1: Generate the native `/android` project folder
```bash
npx expo prebuild --platform android
```
*(This creates the standard Gradle-based native Android folder).*

### Step 2: Open in Android Studio
1. Open **Android Studio**.
2. Click **Open** $\rightarrow$ select the `deviceops-mobile/android` directory.
3. Allow Gradle to sync dependencies.

### Step 3: Build the APK
1. In the top menu, go to: **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
2. Once complete, click **locate** in the popup notification to find your generated `app-debug.apk`.
3. Transfer the APK to your phone or run directly on the emulator with the green **Run (Shift+F10)** button.

---

## ⚙️ Connecting Mobile to your Local Backend

When testing on a physical phone over Wi-Fi, `localhost` refers to the phone itself, not your PC!

1. Find your computer's local Wi-Fi IP address (e.g. `192.168.1.15`):
   * Windows: `ipconfig`
   * Linux/WSL: `hostname -I`
2. Update `.env` in `deviceops-mobile`:
   ```bash
   EXPO_PUBLIC_DEVICEOPS_API_URL=http://192.168.1.15:3000
   ```
3. Ensure your PC's firewall allows inbound traffic on port `3000`.

---

## 🔬 Lessons Learned & Local Build Troubleshooting (WSL2 + Windows)

Building standalone React Native / Expo APKs locally in a hybrid Windows 11 + WSL2 environment is significantly faster than cloud builds, but requires addressing several critical quirks:

### 1. The CMake 3.22.1 Download Hang ("Stuck Build")
* **Issue:** Gradle's Android Gradle Plugin (`LegacyDownloader`) attempts to auto-download `cmake;3.22.1` for C++ native modules (`react-native-reanimated`, `react-native-screens`). On command-line builds, this download uses Java's standard `HttpURLConnection` with infinite socket timeouts and frequently hangs indefinitely without throwing an error.
* **Fix:** Pre-install CMake 3.22.1 into the Android SDK directory:
  ```bash
  # Inside WSL Ubuntu:
  mkdir -p /home/usama/Android/Sdk/cmake/3.22.1
  # Extract cmake-3.22.1-linux binary into this directory with source.properties
  export PATH="/home/usama/Android/Sdk/cmake/3.22.1/bin:$PATH"
  ```

### 2. Kotlin Compiler Daemon Loopback Sockets in WSL
* **Issue:** If builds are cancelled or killed, stale socket files in `~/.local/share/kotlin/daemon` cause the Kotlin compiler client to repeatedly scan dead loopback ports on WSL, stalling the build.
* **Fix:** Configure Gradle to execute the Kotlin compiler in-process inside `~/.gradle/gradle.properties`:
  ```properties
  kotlin.compiler.execution.strategy=in-process
  ```
  This eliminates external daemon socket communication and speeds up Kotlin compilation to seconds.

### 3. Expo SDK Dependency Alignment
* **Issue:** Installing packages with generic `npm install <package>` can install versions meant for newer Expo SDKs (e.g. `expo-image-picker@57` on an SDK 56 project). This introduces incompatible native module interfaces and causes Gradle compilation errors (`Cannot find symbol ImagePickerPackage`).
* **Fix:** Always use Expo's dependency alignment CLI:
  ```bash
  npx expo install --check
  npx expo install --fix
  ```

### 4. WSL2 Build + Windows Host Device Flashing (Recommended Hybrid Workflow)
* **Build inside WSL2:** Building on Linux ext4 bypasses Windows' 260-character path limit (`MAX_PATH`) and avoids file locking issues with Windows Defender, yielding **2x–4x faster builds**.
  ```bash
  # In WSL Ubuntu:
  cd /home/usama/Work/personal/deviceops/deviceops-mobile
  ./build-apk.sh
  ```
* **Install via Windows ADB:** Rather than forwarding physical USB devices into WSL via `usbipd`, use Windows native `adb` to directly flash the generated APK:
  ```powershell
  # In Windows PowerShell:
  adb install -r "W:\home\usama\Work\personal\deviceops\deviceops-mobile\build\deviceops-preview.apk"
  ```


## Incident photo capture release (September 10)

The Evidence tab now captures a camera photo or selects a library image, uploads JPEG bytes with a SHA-256 checksum to the selected incident, shows server scanning/processing status, and asks the technician to confirm the associated incident device. An upload is not an approval or remediation request.

Run `npm run verify` and `npm run test:evidence` before building. Keep the Expo SDK 56 dependency alignment documented above. The new native `expo-crypto` dependency requires rebuilding the APK; an older installed APK does not contain this feature.

The photo-capture release uses `EXPO_PUBLIC_DEVICEOPS_API_URL=http://127.0.0.1:3030`. For the Docker backend on computer port **3030**, run in Windows PowerShell:

```powershell
adb devices
adb reverse tcp:3030 tcp:3030
```

The first port is the phone port; the second is the computer port. Use `-s <DEVICE_ID>` if multiple devices are attached. Windows must be able to reach the WSL backend on localhost:3030.

Start the backend with `compose.hackathon.yaml`, `compose.enterprise.yaml`, and `compose.media-scan.yaml`. Real phone photos require the healthy ClamAV service; a fixture hash allowlist cannot approve arbitrary camera images. Log in as a technician, choose an incident, capture/select a photo, wait for ready/clean status, and confirm the matching device. Verify permission denial, cancellation, and successful upload on the physical phone before recording.

The acoustic feature currently accepts sampled waveform CSV data through the web sandbox. It does not record phone audio or diagnose bearing faults.


### Preview APK artifact verification

`eas.json` explicitly supplies `EXPO_PUBLIC_DEVICEOPS_API_URL=http://127.0.0.1:3030` in the preview profile. The local build uses a unique temporary directory and writes a candidate APK. `scripts/verify-apk.py` verifies its signature, embedded URL, launcher name and current screen text before replacing `build/deviceops-preview.apk`. A correct checkout `.env` alone is insufficient evidence. See the [Expo build-profile environment documentation](https://docs.expo.dev/build/eas-json/).

After installing the newly verified APK, use Windows ADB with `adb reverse tcp:3030 tcp:3030`. Physical handset execution (real camera capture, on-device SHA-256 hashing, reverse-bridge upload to port 3030, ClamAV antivirus quarantine scanning, and technician device association confirmation) has been verified end-to-end on an attached physical Android device (`MVLZHQQOPJM7LFBI`, September 14, 2026).
