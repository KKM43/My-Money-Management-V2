# My Money Management V2 — Architecture

## Current implementation

The current codebase is a React Native application built with Expo and JavaScript.

- Entry point: `index.js`
- Application root: `App.js`
- Navigation: React Navigation native stack
- Backend services: Firebase Authentication, Cloud Firestore, and Cloud Storage
- Local Firebase configuration: `.env`, loaded through `react-native-dotenv`
- Target platforms: Android first; iOS and web remain Expo-supported targets
- Theme support: persistent system, light, and dark modes through `ThemeContext.js`

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
  AccountsScreen.js
  AccountActivityScreen.js
  BudgetSettingsScreen.js
  ProfileScreen.js
ThemeContext.js            Persistent theme mode and active colors
theme.js                   Light and dark theme palettes
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
- Accounts
- AccountActivity
- BudgetSettings
- Profile

The app uses an authentication-aware root. Signed-out users see Login and Signup; signed-in users see the protected finance screens. The Dashboard provides a navigation drawer for Profile, Accounts, Budget Settings, theme switching, and sign out.

## Current Firebase boundary

`services/firebaseConfig.js` initializes one Firebase application and exports:

- `auth` for Firebase Authentication
- `db` for Cloud Firestore
- `storage` for Cloud Storage

Firebase configuration is read from `.env`. The `.env` file is ignored by Git; `.env.example` documents the required variable names.

## Architecture direction

The app evolves incrementally rather than through an untested rewrite.

1. Keep Expo and React Navigation while feature work continues.
2. Keep user-owned Firestore paths and security rules as the data boundary.
3. Separate shared finance calculations and data access from screen components as complexity grows.
4. Move to TypeScript only as a planned milestone, with a safe incremental migration strategy.

## V2 transaction model

Transactions support `income`, `expense`, and `transfer` behaviors.

Transactions are stored at:

```text
/users/{uid}/transactions/{transactionId}
```

Accounts are stored at:

```text
/users/{uid}/accounts/{accountId}
```

The supported account types are `bank`, `cash`, `wallet`, and `creditCard`. Accounts may be archived without losing their history.

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

Budgets are stored at:

```text
/users/{uid}/settings/budget
```

The budget document stores `monthlyBudget` and category budgets. Month-scoped
category keys use `YYYY-MM|Category`; older unscoped keys remain readable for
compatibility. The Dashboard calculates monthly budget progress, category
spending, and a top-five spending summary from the signed-in user's
transactions.

Transactions support search by category or note, income/expense filters, and
native swipe and long-press actions. Profile reset permanently removes the
user's accounts, transactions, and budget document only after explicit
confirmation.

## Key technical decisions

| Decision | Status |
| --- | --- |
| Use a separate Firebase project for V2 | Implemented |
| Keep the existing V1 Firebase project unchanged during V2 development | Required |
| Store Firebase client configuration in local `.env` files | Current practice |
| Commit `.env.example`, never `.env` | Required |
| Centralize authentication navigation | Implemented |
| Use INR and Indian number formatting consistently | Required |
| Use JavaScript during baseline stabilization | Current choice |
| Review TypeScript migration after the V2 structure is stable | Planned |
| Review `newArchEnabled: false` before a production build | Planned |

## Known baseline considerations

- Firestore isolation tests between two users have not yet been added.
- Expo Go runs with the New Architecture enabled, while `app.json` explicitly disables it. This needs a deliberate compatibility decision before production builds.
- Several screens still combine UI, Firestore listeners, and calculations. Extract shared services when the next feature makes that worthwhile.