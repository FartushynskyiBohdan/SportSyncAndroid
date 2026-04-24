# SportSync Mobile (Expo)

React Native / Expo Android client for the SportSync backend.

## Implemented

- Login, registration, forgot-password, and reset-token flows
- Suspended and banned account handling
- Session persistence with AsyncStorage
- Onboarding, discovery filters, swipe discovery, likes, passes, and match modal
- Matches, conversations, message threads, and presence heartbeat
- Own profile, public profile detail, profile editing, photo upload/order/delete
- Account settings, password change, blocked users, delete account
- User blocking, reporting, and admin moderation screens

## Quick Start

```bash
cd mobile
npm install
npm run start
```

Then open the app on an Android emulator or device.

## API URL

Set the backend through `.env`:

```bash
EXPO_PUBLIC_API_URL=https://apisportsync.xyz
```

For a local Android emulator, use:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

For a physical phone on the same Wi-Fi, use your computer's LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

## Demo Mode

The app defaults to the real backend. If the backend is unavailable and you only need a polished walkthrough, enable the built-in demo data:

```bash
EXPO_PUBLIC_DEMO_MODE=true
```

For coursework submission, build the self-contained APK profile:

```bash
npx eas-cli build --platform android --profile submission
```

Any non-admin email signs into the athlete app in demo mode. Use an email containing `admin` to show the admin dashboard.
