# My Money Management V2 — Development Rules

## Working approach

- Work on `develop`; keep `main` as the stable baseline.
- Make one focused, testable change at a time.
- Inspect the existing code before replacing or refactoring it.
- Test a feature after each meaningful change.
- Make small, descriptive commits only after testing.
- Keep documentation aligned with the implementation.

## Code conventions

- Use clear names that describe the business meaning of a value or action.
- Keep screens focused on UI and user interaction.
- Move repeated UI into reusable components.
- Move Firebase access and financial calculation logic out of screen components when it becomes shared or complex.
- Avoid adding dependencies without a specific need.
- Do not perform broad formatting, package upgrades, or framework migrations alongside an unrelated feature.
- Preserve existing behavior unless the task explicitly changes it.

## Git and secrets

- Never commit `.env`, Firebase credentials, API keys, tokens, or user data.
- Keep `.env.example` up to date with variable names only; never include real values.
- Check `git status` and `git diff` before every commit.
- Do not force-push, rewrite shared history, or delete branches without an explicit decision.
- Keep the `v1` remote unchanged for reference.

## Data ownership and security

- Every user-owned Firestore document must be scoped to the authenticated user.
- Firestore client rules must enforce ownership; UI checks alone are not security.
- V2 data must use its own Firebase project before V2 feature data is created.
- Do not delete or modify V1 data while developing V2.
- Use user confirmation before creating any transaction suggested from a device notification.

## Financial data rules

- Store money in a consistent representation. The final representation must be defined before implementing V2 calculations.
- Treat income, expense, transfer, and credit-card payment as distinct transaction behaviors.
- A transfer must not change total net worth.
- A credit-card purchase is an expense.
- A credit-card bill payment is a paydown or transfer, not a second expense.
- Dates and timestamps must use one documented strategy across the app.
- Display all user-facing amounts in INR with Indian number formatting.
- Validate required fields and non-negative amounts before saving data.
- Do not silently overwrite or delete a financial record.

## Quality checks

Before a feature commit:

1. Run the affected app flow.
2. Check for errors in Metro, the device, and the browser console when relevant.
3. Confirm the change works for the signed-in user’s data only.
4. Review the Git diff for unrelated files and secrets.
5. Commit with a concise message describing the change.
