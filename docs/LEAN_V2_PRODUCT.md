# My Money Management — Lean V2

## 1. Purpose

My Money Management V2 is not primarily an expense tracker.

Its main purpose is to help a user answer:

**After my unavoidable expenses and the amount I want to save, how much money can I safely spend for the rest of this month?**

The application should help the user:

Understand monthly income.

Understand unavoidable fixed commitments.

Choose how much they personally want to save.

Know how much money remains available for normal living expenses.

Track actual spending.

Continuously recalculate how much money is safe to spend per day.

The core product flow is:

```text
PLAN
  ↓
SPEND
  ↓
RECALCULATE
  ↓
SAVE
```

---

# 2. Product Philosophy

The application must remain simple.

The Dashboard should not become a collection of unrelated finance widgets.

Features should only be added when they help the user answer one or more of these questions:

```text
What do I earn?

What must I pay?

What do I want to save?

What can I spend?

What have I spent?

What is left?

How much can I safely spend today?
```

The application must not force financial rules such as 50/30/20.

The user decides their own savings amount and spending plan.

Percentages are information, not rules.

---

# 3. Monthly Plan

Each calendar month has its own money plan.

Example:

```text
September 2026

Income
₹35,000

Fixed commitments
₹20,227

Savings target
₹4,000

Planned spendable money
₹10,773
```

A month's historical plan should eventually remain intact even if fixed expenses or income change in later months.

The month is identified using:

```text
YYYY-MM
```

Example:

```text
2026-09
```

---

# 4. Income Sources

A user can have one or more planned income sources for a month.

Examples:

```text
Salary
Freelance
Business
Bonus
Other
```

These are not required to repeat forever.

They represent income expected for that month's plan.

Example:

```text
Salary       ₹35,000
Freelance     ₹5,000
--------------------
Total         ₹40,000
```

Formula:

```text
totalIncomePaise
=
sum of all planned income source amounts
```

All money calculations and stored monetary values should use integer paise.

---

# 5. Fixed Commitments

Fixed commitments are expenses that the user expects to pay regardless of normal daily spending.

Examples:

```text
Rent
EMI
Mobile recharge
Internet
Insurance
Subscription
School fees
Other fixed obligations
```

These must always be editable because:

```text
rent can change
an EMI can finish
a subscription can be cancelled
a new commitment can appear
an existing amount can change
```

Formula:

```text
totalFixedPaise
=
sum of all fixed commitments
```

Then:

```text
moneyAfterFixedPaise
=
totalIncomePaise
-
totalFixedPaise
```

If fixed commitments exceed income, the application must show the negative result rather than hiding it.

---

# 6. Savings Decision

After fixed commitments are deducted, the user chooses how much of the remaining money they want to protect as savings.

The application should provide an interactive control such as a slider.

Example:

```text
Income                 ₹35,000
Fixed commitments     -₹20,227
                       --------
After fixed             ₹14,773

Chosen savings          ₹4,000
                       --------
Spendable               ₹10,773
```

Formula:

```text
plannedSpendablePaise
=
moneyAfterFixedPaise
-
savingsTargetPaise
```

Savings percentage of income:

```text
savingsPercentage
=
savingsTargetPaise
/
totalIncomePaise
× 100
```

Only calculate this percentage when income is greater than zero.

The application must not automatically choose the user's savings target.

---

# 7. Planned Money vs Actual Money

Lean V2 must distinguish between the user's plan and what actually happens.

## Plan

```text
Income
Fixed commitments
Savings target
Planned spendable money
```

## Actual

```text
Variable expenses already spent
Spendable money remaining
Days remaining
Safe-to-spend amount per day
```

Transactions provide the actual spending data.

---

# 8. Variable Expenses

Variable expenses are normal expenses paid from the user's spendable money.

Examples:

```text
Food
Travel
Groceries
Entertainment
Shopping
Daily necessities
Other discretionary spending
```

These reduce available spendable money.

Formula:

```text
variableSpentPaise
=
sum of variable expense transactions
for the current month
```

Then:

```text
remainingSpendablePaise
=
plannedSpendablePaise
-
variableSpentPaise
```

Overspending must be allowed to produce a negative number.

The application should not hide overspending by clamping the financial amount to zero.

---

# 9. Fixed Commitment Payments Must Not Be Counted Twice

A fixed commitment is already reserved when the monthly plan is calculated.

Example:

```text
Income          ₹35,000
Rent reserved  -₹14,000
```

When the user later records the actual ₹14,000 rent payment, that transaction must affect the relevant account balance.

However, it must NOT reduce planned spendable money again.

Otherwise rent would effectively be deducted twice.

A transaction representing payment of a planned fixed commitment should eventually be linked to that commitment.

Conceptually:

```js
{
  type: "expense",
  amountPaise: 1400000,
  fixedCommitmentId: "rent-commitment-id"
}
```

Variable-spending calculations exclude expenses linked to fixed commitments.

---

# 10. Safe to Spend

The most important calculated value in Lean V2 is:

**Safe to Spend per Day**

For the current month:

```text
remainingSpendablePaise
=
plannedSpendablePaise
-
variableSpentPaise
```

The number of remaining days should include today.

Example:

If today is September 25 and September has 30 days:

```text
September 25
September 26
September 27
September 28
September 29
September 30
```

There are 6 spending days remaining including today.

Formula:

```text
daysRemainingIncludingToday
=
daysInCurrentMonth
-
currentDay
+
1
```

Then:

```text
safeToSpendPerDayPaise
=
remainingSpendablePaise
/
daysRemainingIncludingToday
```

Example:

```text
Remaining spendable
₹7,200

Days remaining
6

Safe to spend
₹1,200/day
```

This number must recalculate whenever spending changes.

---

# 11. Overspending

The application must handle overspending honestly.

Example:

```text
Planned spendable       ₹10,000
Already spent           ₹11,500
Remaining               -₹1,500
```

The Dashboard should show that the user is over their available spending amount.

It should not silently display:

```text
₹0 remaining
```

The user needs the real financial position.

---

# 12. Onboarding

A new user should follow this sequence:

```text
Welcome
↓
Name
↓
Income sources
↓
Fixed commitments
↓
Money after fixed commitments
↓
Choose savings target
↓
Review monthly plan
↓
Start tracking
```

Each screen should ask for one clear decision.

Onboarding should not expose Accounts, Analytics, Goals, Transfers, Budgets, or advanced financial features unnecessarily.

---

# 13. Dashboard

The Lean V2 Dashboard should prioritize:

```text
User name

Current month

Income

Fixed commitments

Savings target

Planned spendable money

Variable spending so far

Spendable money remaining

Days remaining

Safe to spend per day

Add Expense
```

The most prominent information should be:

```text
REMAINING TO SPEND

and

SAFE TO SPEND / DAY
```

The Dashboard must remain visually quiet.

Advanced information should not compete with these numbers.

---

# 14. Existing Features

Existing transaction, account, transfer, credit-card, analytics, budget and savings-goal code should not initially be deleted.

Lean V2 can hide secondary features from the primary experience while keeping useful infrastructure available.

Transactions remain core because they provide actual spending.

Accounts remain useful because they represent where money physically exists.

Transfers remain important because moving money between the user's own accounts must not be treated as spending.

Analytics, category budgets and long-term savings goals are secondary until the Lean V2 core experience is complete.

---

# 15. Core Product Rule

Before adding any future feature, ask:

**Does this help the user plan, control, understand, or save their money?**

If the answer is no, the feature does not belong in the Lean V2 core.