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
/users/{uid}/accounts/{accountId}
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
- Add Transaction includes a themed in-app date picker and compact category picker.
- Existing transactions can be edited without creating duplicates.
- Added accounts, account activity, transfers, credit-card payments, and archive controls.
- Added monthly and category budgets with Dashboard progress and spending summaries.
- Added persistent theme modes, gesture actions, and a confirmed Profile data reset.

## Known follow-up work

- Review the Expo New Architecture warning before creating a production build.
- Plan tests for Firestore access isolation between two V2 users.
- Consider extracting shared data access and calculations from large screen components.

## Transaction decisions

- Future-dated transactions are allowed for planned transactions.
- Phase 3 initially supports bank, cash, wallet, and credit-card accounts.
- Accounts support either a non-income opening balance or a zero balance followed by a normal transaction.
- New income and expense transactions will require an account; existing transactions without an account remain unchanged until migration is planned.
- Existing unassigned transactions will be excluded from account balances in the first account-enabled release.
- Transfers use one transaction record with source and destination account IDs and do not affect dashboard net worth.
- A transfer into a credit-card account is labeled as `cardPayment` and is not counted as a second expense.
- Category budgets use month-scoped `YYYY-MM|Category` keys while retaining compatibility with legacy unscoped keys.
- Budget over-limit status is shown inline in the Dashboard rather than through repeated alerts.