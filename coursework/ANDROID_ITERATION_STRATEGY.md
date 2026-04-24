# Android Iteration Strategy

## Recommendation

Do **not** start a fresh Android Studio or Kotlin project for this coursework.

The fastest and strongest Android iteration is to continue from the existing Expo React Native client in `mobile/`, then present the polished version through a Figma navigation demo. That gives you both:

- a credible mobile implementation path
- a high-fidelity prototype that fits the brief exactly

## Why This Is The Best Approach

- The assignment is about app design and prototyping, not shipping a production APK.
- The repository already includes a mobile codebase with authentication, onboarding, discover, matches, messaging, profile, settings, and admin flows.
- Rewriting the project natively would add technical risk without adding much marking value.
- A Figma prototype lets you refine the mobile UX even where the coded build is still pragmatic rather than polished.

## What Already Exists In `mobile/`

- Login and registration
- Onboarding flow
- Discover swipe cards
- Matches list
- Messaging screen
- Profile and profile editing
- Discovery settings and account settings
- Suspended account handling
- Admin view

## What Was Verified

On **April 24, 2026**:

- `mobile/package.json` was updated so `expo-constants` is installed
- `npx tsc --noEmit` passes in `mobile/`

## Best Submission Story

Use this wording if needed:

> The Android iteration was approached as a mobile-first redesign of the existing SportSync system. Rather than rebuilding the platform from scratch, I adapted the existing interaction model into a React Native proof of concept and used that as the reference point for a higher-fidelity Figma prototype.

## If The Lecturer Wants A Runnable Mobile Demo

Use the existing Expo app.

1. Go to `mobile/`
2. Install dependencies with `npm install`
3. Set `EXPO_PUBLIC_API_URL` to your backend URL if you are not using the Android emulator fallback
4. Start Expo with `npm run start`
5. Open the app on an Android emulator or device

The current default fallback is `http://10.0.2.2:3000`, which is suitable for an Android emulator when the backend is running locally.

## If The Lecturer Explicitly Wants An APK

Only attempt this if they really insist.

- The project already contains `mobile/eas.json`, which is a good base for Android builds.
- The practical route is an Expo/EAS Android build, not a new native rewrite.
- If an APK cannot be generated in time, submit the Figma navigation demo plus a short recorded walkthrough of the Expo app and explain that the mobile proof of concept already exists.

## Short Answer

If you only remember one thing:

> Build the coursework around the existing mobile client and submit a Figma navigation demo based on it. Treat a native Android package as optional evidence, not the main deliverable.
