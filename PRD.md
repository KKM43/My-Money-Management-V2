# My Money Management V2 — Product Requirements

## Purpose

My Money Management V2 is a personal finance app for individuals who want a clear, reliable view of their money, spending, budgets, and financial goals.

V2 improves the existing V1 app incrementally. It must remain understandable, accurate, and secure rather than adding every possible feature at once.

## Target user

The initial user is an individual managing personal finances in Indian rupees (INR), including everyday spending, income, bank accounts, wallets, and credit cards.

## Product goals

- Make it quick to record, find, and understand transactions.
- Show a useful current financial overview.
- Support multiple accounts and transfers without inaccurate totals.
- Help users set and track realistic budgets.
- Keep financial data private and owned by the signed-in user.
- Provide a consistent, polished mobile experience.

## First release scope

The first V2 release will focus on:

- Reliable sign-up, sign-in, sign-out, and session handling.
- A dashboard with balances, recent transactions, and monthly spending.
- Creating, editing, deleting, searching, and filtering transactions.
- Income and expense categories.
- Multiple accounts or wallets.
- Transfers between accounts.
- Monthly and category-based budgets.
- INR currency formatting using Indian number conventions.
- A secure V2 Firebase project with user-owned Firestore data.
- Basic analytics for income, expenses, category spending, and trends.

## Important financial rules

- Every transaction belongs to exactly one signed-in user.
- Money received is income; money spent is an expense.
- A transfer moves money between accounts and must not change the user’s total net worth.
- A credit-card purchase is an expense.
- Paying a credit-card bill is a card payment or paydown, not a second expense.
- Financial values, dates, categories, and account references must be stored consistently.
- The app must display monetary values in INR using Indian formatting.

## Later features

These are valuable, but are outside the first release unless explicitly brought forward:

- Recurring transactions and payments.
- Savings goals.
- Credit-card due-date reminders.
- Push notifications and budget reminders.
- Advanced reports and exports.
- Android payment-notification detection using a detect → suggest → user-confirm workflow.
- AI-assisted insights.
- iOS payment detection.

## Privacy and security requirements

- V2 will use a separate Firebase project from V1.
- Firestore rules must restrict each user to their own data.
- Secrets and local Firebase configuration must not be committed to Git.
- No transaction may be created automatically from a payment notification; the user must confirm it.
- Existing V1 data must not be changed or deleted while building V2.

## Success criteria

The first V2 release is successful when a user can securely sign in, manage accurate transactions across accounts, understand monthly spending and budgets, and use the app without common financial calculations being duplicated or misleading.