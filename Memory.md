# My Money Management V2 — Project Memory

## Current state

- Active branch: `develop`
- Stable baseline branch: `main`
- V1 remote remains available as `v1`.
- The existing Expo app runs in Expo Go with SDK 54-compatible Expo Go.
- Firebase configuration is loaded from ignored local `.env`.

## V2 Firebase

- Firebase project: `my-money-management-v2-dev`
- Authentication: Email/Password enabled.
- Firestore: production mode in `asia-south1` (Mumbai).
- Firestore rules are stored in `firestore.rules` and have been published.
- V2 Firebase configuration is local only and must not be committed.

## Current data structure

```text
/users/{uid}
/users/{uid}/transactions/{transactionId}
/users/{uid}/settings/budget
```

The previous V1-style top-level `transactions` and `userSettings` paths are not used by V2.

## Implemented foundation

- Added the required Expo Babel preset.
- Configured Firebase Auth persistence with React Native AsyncStorage.
- Added authentication-aware navigation:
  - Signed-out users see Login and Signup.
  - Signed-in users see the protected app screens.
  - Signing out returns users to Login.
- Migrated transaction and budget reads/writes to the V2 user-owned paths.
- Updated the dashboard to listen for live budget changes.
- Transactions use integer paise and local `YYYY-MM-DD` calendar dates.
- Add Transaction includes a native date picker.
- Existing transactions can be edited without creating duplicates.

## Known follow-up work

- Review the Expo New Architecture warning before creating a production build.
- Define the final V2 transaction data model before adding editing, accounts, or transfers.
- Standardize all currency formatting to INR; the Add Transaction screen still contains legacy USD formatting code.
- Plan tests for Firestore access isolation between two V2 users.