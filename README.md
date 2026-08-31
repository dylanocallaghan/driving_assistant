# IrishDrive AI Mobile App

React Native mobile application for IrishDrive AI, built with Expo and TypeScript.

This app currently includes MVP foundation work through:

- Milestone 1: Project Foundation
- Milestone 2: Onboarding
- Milestone 3: Home Screen
- Milestone 4: Driving Session Setup

## Current Scope

Implemented now:

- Persistent onboarding completion state
- Home screen with a primary Start session entry point
- Pre-drive session setup flow with safety confirmations
- Local in-app start/stop session lifecycle UI

Not implemented yet:

- Camera permissions or capture
- GPS permissions or capture
- Sensor permissions or capture
- Telemetry collection or analysis
- Driving event detection
- Scoring or AI coaching
- Backend/API integration
- Authentication
- Database/session history persistence
- Payments/subscriptions

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19.1
- TypeScript 5.9
- AsyncStorage for onboarding state persistence

## Prerequisites

- Node.js 22+
- npm
- Expo Go 54 on your phone

## Getting Started

From this directory (`mobile/`):

```bash
npm install
npm run start
```

Then in Expo Go on your phone:

1. Ensure phone and computer are on the same network.
2. Scan the QR code shown by Expo CLI.
3. Open the project in Expo Go.

## Scripts

- `npm run start`: Start Expo dev server
- `npm run android`: Open Android emulator/device
- `npm run ios`: Open iOS simulator (macOS only)
- `npm run web`: Start web target
- `npm run typecheck`: Run TypeScript validation

## Environment

Create a local env file from example:

```bash
cp .env.example .env
```

Set:

- `EXPO_PUBLIC_APP_ENV=development|staging|production`

## Project Structure

```text
mobile/
  src/
    config/
      env.ts
    core/
      AppRoot.tsx
      ErrorBoundary.tsx
    screens/
      OnboardingScreen.tsx
      HomeScreen.tsx
      SessionSetupScreen.tsx
      SessionActiveScreen.tsx
    storage/
      onboardingStorage.ts
```

## Validation

Before pushing changes, run:

```bash
npm run typecheck
npx --yes expo-doctor
npx expo export --platform android --clear
```

## Documentation Source of Truth

Product and architecture decisions are maintained in the repository docs at the project root:

- `../docs/PRODUCT.md`
- `../docs/ARCHITECTURE.md`
- `../docs/ASSESSMENT-SPECIFICATION.md`
- `../docs/SCORING.md`
- `../docs/ROADMAP.md`
- `../docs/DECISIONS.md`
