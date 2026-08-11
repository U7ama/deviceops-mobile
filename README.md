# DeviceOps Technician Mobile

Expo SDK 56 / TypeScript companion client for the DeviceOps synthetic reference implementation.

> Source available for portfolio review; all rights reserved; no permission to reuse or redistribute.

The app uses the core API for mobile login, tenant-scoped device status, diagnosis creation, and reconnectable run polling. Access and refresh tokens are stored in Expo SecureStore. The server remains authoritative: the client never executes consequential actions offline, accepts model-supplied tenant IDs, or stores raw media in its offline cache.

## Local run

1. Start the core web/API and worker from `deviceops-ai-copilot`.
2. Set `EXPO_PUBLIC_DEVICEOPS_API_URL` to a reachable machine URL. Android emulators use `http://10.0.2.2:3000`; a physical device needs the host's LAN address and a reachable firewall rule.
3. Install the pinned Expo SDK 56 dependencies and run `npm start`.

The local seeded password is intentionally not embedded in this repository. Use the temporary password printed by the core seed command.

## Contract integrity

`npm run contracts:check` verifies the checked-in contract version and schema hash exported by the core repository. A stale companion manifest must fail CI before a mobile build is distributed.

## Known boundary

Camera, audio recording, push notification, and EAS credentials are adapters for the later device build. The current runnable path is text-first and uses synthetic telemetry; no real device control or production mobile claim is made.
