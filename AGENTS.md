# DeviceOps Mobile Guidelines & Guardrails

## 1. Dependency Management (Strict Expo SDK 56)
- **Always use Expo CLI for package installs**: Never run raw `npm install <expo-package>` without pinning. Always run:
  ```bash
  npx expo install <package-name>
  ```
- **Verify Version Alignment**: If dependency issues occur, run `npx expo install --check` and `npx expo install --fix` before modifying Gradle configurations. Do not allow packages targeting newer React Native versions (e.g., RN 0.86 / SDK 57) into this SDK 56 codebase.

## 2. Local Android Compilation Environment
- **WSL2 for Compilation**: Always run Gradle and EAS local builds (`eas build --local`) inside WSL2 Ubuntu for ext4 I/O performance and to avoid Windows 260-character path limits.
- **In-Process Kotlin Daemon**: Always ensure `kotlin.compiler.execution.strategy=in-process` is present in `~/.gradle/gradle.properties` in WSL to avoid daemon loopback hangs.
- **Pre-installed CMake**: Rely on the pre-installed CMake 3.22.1 at `/home/usama/Android/Sdk/cmake/3.22.1`. Never let Gradle attempt headless CLI auto-downloads of CMake.

## 3. Device Testing & Flashing
- **Windows Host ADB**: When flashing to a physical phone connected via USB, execute ADB commands from Windows PowerShell (`adb -s <DEVICE_ID> install -r <path>`), avoiding the complexity of USB passthrough into WSL.

<!-- BEGIN SHARED AI CONTINUITY -->
## AI continuity

For model handoffs, read `.ai/PROJECT.md` and the current `.ai/HANDOFF.md`. Confirm facts against current files and Git state; the setup snapshot does not establish current application health. Follow existing project and nested instructions. Record checks actually run, unresolved issues and the next step after useful progress changes. Preserve user changes and use separate worktrees or different files for simultaneous edits.
<!-- END SHARED AI CONTINUITY -->
