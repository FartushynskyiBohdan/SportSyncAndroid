# Figma Prototype Brief

This is the fastest route to a strong group prototype submission.

## Prototype Goal

Create a **mobile-first high-fidelity Figma navigation demo** for SportSync, using the existing mobile client as the interaction reference and polishing the UX into a cleaner Android-style presentation.

## Device Frame

Use a modern Android phone frame such as:

- `412 x 915` for a Pixel-style screen

If your group already uses a different mobile frame size, keep it consistent across every screen.

## Visual System

Use the palette already defined in `mobile/src/theme/palette.ts`:

- Background: `#070B1F`
- Panel: `#0E1633`
- Panel soft: `#121D3F`
- Accent: `#8B5CF6`
- Accent soft: `#A78BFA`
- Text: `#F5F7FF`
- Muted text: `#9AA8D6`
- Danger: `#EF4444`

Visual direction:

- dark athletic aesthetic
- bold contrast
- rounded cards
- strong image-led discover view
- short, high-impact labels

## Minimum Screen Set

Build these screens first:

1. Login
2. Register
3. Onboarding
4. Discover
5. Match success modal
6. Matches
7. Messages
8. Profile
9. Settings

If time allows, add:

- User profile detail
- Discovery filters

## Core Components

- Bottom navigation bar with `Discover`, `Matches`, `Messages`, and `Profile`
- Full-width CTA buttons
- Rounded input fields
- Sport chips or tags
- Large image cards
- Message bubbles
- Profile stat sections
- Settings cards

## Recommended Interaction Links

- `Login` -> `Discover` for returning users
- `Register` -> `Onboarding`
- `Onboarding` -> `Discover`
- `Discover` -> `User Profile`
- `Discover Like` -> `Match Modal`
- `Match Modal` -> `Matches` or back to `Discover`
- `Matches` -> `Messages`
- `Profile` -> `Settings`

## Suggested Demo Script

Keep the prototype demo to about 60-90 seconds:

1. Open on `Login`
2. Show `Register`
3. Move into `Onboarding`
4. Enter `Discover`
5. Open a profile
6. Trigger a match
7. Move to `Matches`
8. Open `Messages`
9. Finish on `Profile` and `Settings`

## Small Improvements Over The Current Coded Build

The Figma prototype can be slightly cleaner than the codebase:

- move `Settings` under `Profile` instead of keeping it as a persistent tab
- tighten spacing so the design feels more intentional
- keep labels short and readable
- make shared-sport information more visually prominent
- emphasize trust and moderation controls where relevant

## What The Prototype Should Communicate

The marker should understand these points within one minute:

- the app is for athletes, not general dating
- sport identity is part of matching logic
- the user can move quickly from onboarding to discovery to messaging
- the interface is mobile-first and realistic rather than abstract

## Useful Source Screens

Use these parts of the codebase as visual references while drawing in Figma:

- `frontend/src/app/pages/PrototypeRedesign.tsx`
- `mobile/src/screens/LoginScreen.tsx`
- `mobile/src/screens/RegisterScreen.tsx`
- `mobile/src/screens/OnboardingScreen.tsx`
- `mobile/src/screens/tabs/DiscoverScreen.tsx`
- `mobile/src/screens/tabs/MatchesScreen.tsx`
- `mobile/src/screens/tabs/MessagesScreen.tsx`
- `mobile/src/screens/tabs/ProfileScreen.tsx`
- `mobile/src/screens/tabs/SettingsScreen.tsx`
