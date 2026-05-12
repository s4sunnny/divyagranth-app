# Divya Granth — React Native App

The mobile client for Divya Granth. Builds for iOS and Android from one TypeScript codebase.

## Stack

- **React Native 0.74** + TypeScript
- **React Navigation** (native stack + bottom tabs)
- **AsyncStorage** for all user-generated data (no login, no cloud)
- **NetInfo** to gate network requests when offline
- **react-native-vector-icons** + **react-native-linear-gradient** for the visual style

## Quick start

```bash
# 1. Install JS deps
cd app
npm install

# 2. iOS only — install pods
cd ios && pod install && cd ..

# 3. Run the backend (in a separate terminal)
cd ../backend
./mvnw spring-boot:run

# 4. Start Metro
npm start

# 5. In another terminal, run the app
npm run android    # or
npm run ios
```

The app expects the backend on `http://10.0.2.2:8080` (Android emulator) or `http://localhost:8080` (iOS simulator). Override in `src/utils/config.ts`.

## Project layout

```
src/
├── api/               BookApi — talks to backend with offline cache fallback
├── components/        Reusable UI: GradientHeader, DeityCard, BookCard
├── data/              Static deity catalog + bundled offline books
├── navigation/        AppNavigator (stack + tabs)
├── screens/           One file per screen
├── storage/           AsyncStorage layer (settings, bookmarks, highlights, notes, progress)
├── theme/             Colors, typography, ThemeContext
├── types/             Domain types shared by every layer
└── utils/             Config and small helpers
```

## Where user data lives

Everything the user generates is in AsyncStorage under namespaced keys (see `src/storage/keys.ts`). There is **no login**, **no remote sync**, and the backend never receives a single user-specific byte. If the user uninstalls the app, their data is gone.

## Adding fonts to match the HTML designs

The HTML designs use Cinzel and Noto Serif/Sans Devanagari. To reproduce that on device:

1. Download the .ttf files from Google Fonts.
2. Copy them into `android/app/src/main/assets/fonts/` and add a `fonts/` group inside `ios/DivyaGranth/Resources/`.
3. Run `npx react-native-asset` to link them.
4. Verify the font names match what `src/theme/typography.ts` expects.

## Building offline-first

The app already bundles Hanuman Chalisa locally. To bundle more books:

1. Either author them as TypeScript constants in `src/data/localBooks.ts` (good for short texts), or place JSON files under `src/data/localBooks/` and import them.
2. Set `isLocal: true` and `isPublicDomain: true` in the metadata.
3. Add the entry to the `LOCAL_BOOKS` registry at the bottom of `localBooks.ts`.

The `BookApi.getBook` flow checks the local registry first, then network, then disk cache — so anything in `LOCAL_BOOKS` is always available offline.
