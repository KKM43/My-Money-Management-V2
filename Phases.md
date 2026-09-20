# My Money Management V2 — Development Phases

## Phase 0 — Baseline and project documentation

**Status:** Complete

### Goals

- Verify the V2 repository and local Git baseline.
- Create and publish the `develop` branch.
- Run the existing app successfully.
- Repair the missing Expo Babel preset.
- Add the initial V2 product, architecture, and development-rule documentation.

### Acceptance criteria

- `develop` tracks `origin/develop` and has a clean working tree.
- The existing app starts in Expo Go and an existing user can sign in.
- Firebase configuration is loaded from an ignored local `.env` file.
- Baseline documentation is committed.

## Phase 1 — Secure V2 foundation

**Status:** Complete

### Goals

- Create and configure a separate Firebase project for V2 development.
- Define Firestore data ownership and security rules.
- Introduce authentication-aware navigation.
- Configure persistent Firebase Auth sessions for React Native.
- Establish the initial V2 project structure without a broad rewrite.

### Acceptance criteria

- V2 uses Firebase resources separate from V1.
- A signed-out user sees only authentication screens.
- A signed-in user reaches the protected application area automatically.
- Authentication survives an app restart.
- Firestore rules allow a user to access only their own V2 documents.
- V1 Firebase data and configuration remain unchanged.

## Phase 2 — Transaction foundation

**Status:** Complete

### Goals

- Define the V2 transaction data model.
- Create transactions with consistent amount, date, category, and ownership fields.
- Implement editing and deletion with confirmation.
- Standardize INR formatting and date handling.
- Add basic search and filters.

### Acceptance criteria

- A user can create, view, edit, and delete their own transactions.
- The transaction list and dashboard totals stay accurate after each change.
- Users cannot read or modify another user’s transactions.
- Amounts and dates display consistently.

## Phase 3 — Accounts and transfers

**Status:** Complete

### Goals

- Add accounts and wallets.
- Associate transactions with an account.
- Support transfers between accounts.
- Define credit-card accounts and card-payment behavior.

### Acceptance criteria

- Account balances are calculated accurately.
- Transfers affect the correct two accounts without changing net worth.
- Credit-card purchases and repayments are not double-counted.
- Users can view account-level activity and balances.

## Phase 4 — Budgets and dashboard insights

**Status:** Complete

### Goals

- Improve the dashboard overview.
- Add monthly and category-based budgets.
- Add spending summaries and charts.
- Design reminders without repeated alerts.

### Acceptance criteria

- Dashboard balances, spending, and recent activity are accurate.
- Users can set and track budgets by month and category.
- Budget status is understandable without duplicate alerts.
- Analytics use only the signed-in user’s data.

## Phase 5 — Automation and advanced finance features

### Goals

- Add recurring transactions, savings goals, and credit-card due-date support.
- Investigate Android payment-notification suggestions.
- Add notification preferences and user confirmation workflows.

### Acceptance criteria

- Recurring transactions can be reviewed and controlled by the user.
- Payment detection never creates a transaction without confirmation.
- Notification permissions and privacy implications are clearly explained.
- Advanced features preserve the financial-data rules in `Rules.md`.

## Next active phase

Phase 5 is the next phase. Begin with a focused decision on recurring
transactions, savings goals, or credit-card due dates before implementing
automation.