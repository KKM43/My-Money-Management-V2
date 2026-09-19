# My Money Management V2 — Architecture

## Current baseline

The current codebase is a React Native application built with Expo and JavaScript.

- Entry point: `index.js`
- Application root: `App.js`
- Navigation: React Navigation native stack
- Backend services: Firebase Authentication, Cloud Firestore, and Cloud Storage
- Local Firebase configuration: `.env`, loaded through `react-native-dotenv`
- Target platforms: Android first; iOS and web remain Expo-supported targets

## Current project structure

```text
assets/                 Application images and icons
components/             Reusable UI components
  TransactionItem.js
  WalletIcon.js
screens/                Screen-level UI and feature logic
  LoginScreen.js
  SignupScreen.js
  DashboardScreen.js
  AddTransactionScreen.js
  BudgetSettingsScreen.js
services/
  firebaseConfig.js     Firebase initialization and exported services
App.js                  Navigation container and stack definitions
```

## Current navigation

`App.js` defines a native-stack navigator with these routes:

- Login
- Signup
- Dashboard
- AddTransaction
- BudgetSettings

The app currently starts at `Login`. Individual screens control navigation after authentication. This works as a baseline, but V2 should introduce a central authentication gate so the displayed navigation tree follows the actual Firebase session state.

## Current Firebase boundary

`services/firebaseConfig.js` initializes one Firebase application and exports:

- `auth` for Firebase Authentication
- `db` for Cloud Firestore
- `storage` for Cloud Storage

Firebase configuration is read from `.env`. The `.env` file is ignored by Git; `.env.example` documents the required variable names.

## V2 architecture direction

V2 will evolve the current structure incrementally rather than undergo an untested rewrite.

1. Keep Expo and React Navigation while the current baseline is stabilized.
2. Add an authentication-aware application root before expanding feature work.
3. Separate screen presentation from finance data access and business calculations.
4. Create a dedicated V2 Firebase project and user-scoped Firestore rules before storing V2 data.
5. Define the Firestore collections, document ownership, and indexes before implementing multi-account and transfer features.
6. Move to TypeScript only as a planned milestone, with a safe incremental migration strategy.

## V2 transaction model

Phase 2 supports `income` and `expense` transactions. Transfers and credit-card payments will be added later as distinct transaction behaviors.

Transactions are stored at:

```text
/users/{uid}/transactions/{transactionId}
```

Phase 3 accounts are stored at:

```text
/users/{uid}/accounts/{accountId}
```

The initial account types are `bank`, `cash`, `wallet`, and `creditCard`.

Transfers are stored as one transaction with `type: "transfer"`,
`fromAccountId`, and `toAccountId`. They decrease the source account and
increase the destination account without affecting net worth.

When the destination account is a credit card, the transfer also stores
`paymentKind: "cardPayment"` and is displayed as a card payment. It remains a
transfer and is not counted as an expense.

An account may be created with an optional `openingBalancePaise`. This opening
balance is a starting value, not income. Users may also create an account with
a zero opening balance and record the initial money separately as a normal
transaction.

New income and expense transactions require an `accountId`. Existing
transactions without an account reference remain valid until an explicit
migration strategy is applied.

For the first account-enabled release, existing unassigned transactions are
excluded from account balances rather than being assigned automatically.



## Key technical decisions

| Decision | Status |
| --- | --- |
| Use a separate Firebase project for V2 | Planned and required before V2 data work |
| Keep the existing V1 Firebase project unchanged during V2 development | Required |
| Store Firebase client configuration in local `.env` files | Current practice |
| Commit `.env.example`, never `.env` | Required |
| Centralize authentication navigation | Planned |
| Use INR and Indian number formatting consistently | Required |
| Use JavaScript during baseline stabilization | Current choice |
| Review TypeScript migration after the V2 structure is stable | Planned |
| Review `newArchEnabled: false` before a production build | Planned |

## Known baseline considerations

- Firebase Auth currently uses memory-only session persistence in React Native. V2 should configure persistence using the installed AsyncStorage package.
- Expo Go runs with the New Architecture enabled, while `app.json` explicitly disables it. This needs a deliberate compatibility decision before production builds.
- Current Firestore collections and indexes have not yet been documented. Do not assume their shape; inspect them before designing V2 data migrations.