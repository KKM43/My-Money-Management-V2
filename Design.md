# My Money Management V2 — Design Principles

## Design goal

V2 should feel calm, clear, and trustworthy. Financial information must be easy to understand at a glance, while common actions such as adding a transaction should require minimal effort.

## Core principles

- Prioritize clarity over decoration.
- Show the most important financial information first.
- Use consistent labels, spacing, colors, and interaction patterns.
- Keep primary actions easy to find.
- Explain errors and empty states in plain language.
- Avoid showing the same financial amount in conflicting formats.

## Visual direction

- Use a clean mobile-first layout with comfortable spacing.
- Support light and dark themes through shared design tokens.
- Use color as a supporting signal, not the only indicator:
  - Income: positive or success styling.
  - Expense: caution or negative styling.
  - Transfer: neutral styling.
  - Budget warning: clear warning styling.
- Use readable text sizes and sufficient color contrast.
- Format all money in INR using Indian number grouping.

## Main screen structure

### Authentication

- Login and sign-up screens should be focused and uncluttered.
- Clearly identify required fields and validation errors.
- Avoid exposing whether an email address exists when an error message could create a privacy concern.

### Dashboard

The dashboard should show:

1. Total balance or net worth.
2. Current-month income and expenses.
3. Budget progress, when budgets exist.
4. Recent transactions.
5. A clear action to add a transaction.

### Transaction management

- Make transaction type, amount, category, account, and date easy to understand.
- Use a real date picker rather than a fixed or hidden selected date.
- Editing and deletion must be deliberate; deletion requires confirmation.
- Search and filters should be easy to clear.
- Empty states should explain what the user can do next.

### Accounts and transfers

- Show each account’s name, type, and current balance.
- Present transfers as movement between two accounts, not income or expense.
- Identify credit-card payments clearly to prevent confusion with expenses.

### Budgets and analytics

- Show budget progress with both an amount and a visual indicator.
- Make it clear which month and category each budget applies to.
- Charts must have labels and accessible summaries; do not rely on color alone.

## Reusable UI patterns

- Shared buttons, text fields, cards, amount displays, loading states, and error messages.
- Consistent confirmation dialogs for destructive actions.
- Consistent loading and empty states for all data-driven screens.
- Use safe-area spacing so controls remain accessible on modern devices.

## Accessibility

- Ensure touch targets are comfortably sized.
- Support screen-reader labels for icons and important controls.
- Maintain readable contrast in both themes.
- Do not communicate status through color alone.
- Test common flows with larger system text where practical.

## Design decisions to make later

- Final color palette and typography.
- Whether the dashboard uses cards, a summary-first layout, or a more compact list.
- Chart library and exact visual treatment.
- Navigation pattern for the authenticated area, such as tabs with nested stacks.