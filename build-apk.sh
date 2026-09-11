#!/usr/bin/env bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

# Load NVM and Node
source "/home/usama/.nvm/nvm.sh"
nvm use 22.16.0

# Android & Java environment
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export ANDROID_HOME="/home/usama/Android/Sdk"
export ANDROID_SDK_ROOT="/home/usama/Android/Sdk"
export ANDROID_NDK_HOME="/home/usama/Android/Sdk/ndk/27.1.12297006"
export NDK_HOME="/home/usama/Android/Sdk/ndk/27.1.12297006"
export CMAKE_DIR="/home/usama/Android/Sdk/cmake/3.22.1"
export PATH="/home/usama/Android/Sdk/cmdline-tools/latest/bin:/home/usama/Android/Sdk/platform-tools:/home/usama/Android/Sdk/cmake/3.22.1/bin:$PATH"

# EAS local build flags
export EAS_SKIP_AUTO_FINGERPRINT=1

# Each build owns its temporary directory; never remove another build workspace.
export EAS_LOCAL_BUILD_WORKINGDIR="$(mktemp -d /tmp/deviceops-android.XXXXXX)"
mkdir -p build
export EXPO_PUBLIC_DEVICEOPS_API_URL="$(node -p 'require("./eas.json").build.preview.env.EXPO_PUBLIC_DEVICEOPS_API_URL')"

eas build --platform android --profile preview --local --output ./build/deviceops-preview-candidate.apk --non-interactive
python3 scripts/verify-apk.py build/deviceops-preview-candidate.apk
mv build/deviceops-preview-candidate.apk build/deviceops-preview.apk
