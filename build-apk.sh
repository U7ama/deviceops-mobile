#!/usr/bin/env bash
set -e

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

# Clean temporary build dir and prepare output dir
rm -rf /tmp/usama/eas-build-local-nodejs/*
mkdir -p build

eas build --platform android --profile preview --local --output ./build/deviceops-preview.apk --non-interactive
