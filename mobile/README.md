# SportSync Mobile (Expo)

This is a React Native mobile client scaffold targeting the existing SportSync backend API.

## Implemented

- Auth login flow against `/api/auth/login`
- Banned handling (inline error)
- Suspended handling (dedicated suspended screen)
- Session persistence with AsyncStorage

## Quick start

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Start Expo:

```bash
npm run start
```

3. Run on Android emulator/device.

## API URL

Set API URL through environment when needed:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npm run start
```

Defaults to `http://10.0.2.2:3000` for Android emulator.
For physical device use your machine LAN IP, for example `http://192.168.1.42:3000`.
