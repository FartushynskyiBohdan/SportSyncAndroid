# SportSync Coursework Pack

This folder repackages the existing SportSync project as a mobile-app design submission for the module brief.

## Recommended Submission Route

The safest route is to submit **Option 1: a Figma navigation demo** and use the existing `mobile/` Expo client as supporting evidence that the concept has already been translated into a mobile interaction model.

Why this is the best approach:

- The brief does not require production code for a strong mark.
- The repository already contains a mobile iteration in `mobile/`, so you are not inventing a new concept at the last minute.
- A Figma prototype is faster to polish than a fully packaged Android APK.
- If questioned, you can honestly say the prototype is based on an implemented React Native proof of concept rather than a purely speculative mockup.

## What To Submit

1. Your individual write-up: [PROJECT_PROPOSAL_DRAFT.md](./PROJECT_PROPOSAL_DRAFT.md)
2. Group high-fidelity prototype: build it from [FIGMA_PROTOTYPE_BRIEF.md](./FIGMA_PROTOTYPE_BRIEF.md) and [NAVIGATION_MAP.md](./NAVIGATION_MAP.md)
3. Supporting appendix for research and validation: [USER_STORIES_AND_SURVEY.md](./USER_STORIES_AND_SURVEY.md)
4. If the lecturer asks about Android specifically: [ANDROID_ITERATION_STRATEGY.md](./ANDROID_ITERATION_STRATEGY.md)

## Verified Project Status

Checked on **April 24, 2026**:

- `frontend/` production build passes with `npm run build`
- `mobile/` TypeScript validation passes with `npx tsc --noEmit`
- The mobile dependency issue was fixed by adding `expo-constants`

## Fast 10-Hour Sprint

1. Use [PROJECT_PROPOSAL_DRAFT.md](./PROJECT_PROPOSAL_DRAFT.md) as your individual submission base and edit only the parts that mention your personal contribution.
2. Recreate the screens listed in [FIGMA_PROTOTYPE_BRIEF.md](./FIGMA_PROTOTYPE_BRIEF.md) in Figma using the color palette already defined in `mobile/src/theme/palette.ts`.
3. Use [NAVIGATION_MAP.md](./NAVIGATION_MAP.md) to connect the prototype interactions.
4. Use the static redesign board at `frontend/src/app/pages/PrototypeRedesign.tsx` and the route `/prototype-redesign` as the clean visual reference instead of the buggy app flow.
5. Use the interactive mocked browser demo at `frontend/src/app/pages/PrototypeMobileDemo.tsx` and the route `/prototype-mobile-demo` if you want the teacher to click through the concept directly.
6. If you have time, run the Expo app from `mobile/` and record a short Android-style walkthrough as optional evidence.
7. Submit the Figma navigation demo as the group prototype and the proposal draft as your individual document.

## One-Sentence Positioning

If you need a simple line for your submission cover:

> SportSync is a mobile-first dating concept for athletes that adapts swipe-based matching, sport identity, and community-oriented interaction into a focused prototype for people whose lifestyle is structured around training.
