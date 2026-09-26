const assert = require("assert");
const {
  calculateAccountBalancePaise,
  calculateFixedCommitmentsPaise,
  calculateMoneyAfterFixedPaise,
  calculateNetWorthPaise,
  calculatePlannedIncomePaise,
  calculatePlannedSpendablePaise,
  calculateRemainingSpendablePaise,
  calculateSafeToSpendPerDayPaise,
  calculateSavingsPercentage,
  calculateVariableSpentPaise,
  getAccountDisplayAmountPaise,
  getAmountPaise,
  getDaysRemainingInMonth,
  isTransactionInMonth,
  parseMoneyInputToPaise,
  isVariableExpenseTransaction,
} = require("../utils/finance");

const today = new Date(2026, 8, 21, 12);
const cash = { id: "cash", type: "cash", openingBalancePaise: 10000 };
const bank = { id: "bank", type: "bank", openingBalancePaise: 0 };
const card = { id: "card", type: "creditCard", openingBalancePaise: 0 };

const transactions = [
  { type: "income", accountId: "cash", amountPaise: 50000, occurredOn: "2026-09-20" },
  { type: "expense", accountId: "cash", amountPaise: 1250, occurredOn: "2026-09-21" },
  { type: "transfer", fromAccountId: "cash", toAccountId: "bank", amountPaise: 2000, occurredOn: "2026-09-21" },
  { type: "expense", accountId: "card", amountPaise: 3000, occurredOn: "2026-09-20" },
  { type: "transfer", fromAccountId: "cash", toAccountId: "card", amountPaise: 1000, paymentKind: "cardPayment", occurredOn: "2026-09-21" },
  { type: "income", accountId: "cash", amountPaise: 9000, occurredOn: "2026-09-22" },
];

const cardWithOpeningDebt = {
  id: "card-opening-debt",
  type: "creditCard",
  openingBalancePaise: -500000,
};

assert.strictEqual(calculateAccountBalancePaise(cash, transactions, today), 55750);
assert.strictEqual(calculateAccountBalancePaise(bank, transactions, today), 2000);
assert.strictEqual(calculateAccountBalancePaise(card, transactions, today), -2000);
assert.strictEqual(getAccountDisplayAmountPaise(card, -2000), 2000);
assert.strictEqual(
  calculateNetWorthPaise([cash, bank, card], transactions, today),
  55750,
);
assert.strictEqual(getAmountPaise({ amount: 12.34 }), 1234);

assert.strictEqual(
  calculateAccountBalancePaise(cardWithOpeningDebt, [], today),
  -500000,
);

assert.strictEqual(
  getAccountDisplayAmountPaise(cardWithOpeningDebt, -500000),
  500000,
);

assert.strictEqual(
  calculateNetWorthPaise([cardWithOpeningDebt], [], today),
  -500000,
);


assert.strictEqual(
  isVariableExpenseTransaction(
    {
      type: "expense",
      amountPaise: 200000,
      date: "2026-09-20",
    },
    2026,
    8,
    new Date("2026-09-25T12:00:00"),
  ),
  true,
);

assert.strictEqual(
  isVariableExpenseTransaction(
    {
      type: "expense",
      amountPaise: 1400000,
      date: "2026-09-20",
      fixedCommitmentId: "rent",
    },
    2026,
    8,
    new Date("2026-09-25T12:00:00"),
  ),
  false,
);

assert.strictEqual(
  isVariableExpenseTransaction(
    {
      type: "expense",
      amountPaise: 50000,
      date: "2026-09-26",
    },
    2026,
    8,
    new Date("2026-09-25T12:00:00"),
  ),
  false,
);

assert.strictEqual(
  isVariableExpenseTransaction(
    {
      type: "transfer",
      amountPaise: 100000,
      date: "2026-09-20",
    },
    2026,
    8,
    new Date("2026-09-25T12:00:00"),
  ),
  false,
);


// Transfer should move money without changing total net worth.
const transferOnlyAccounts = [
  { id: "transfer-cash", type: "cash", openingBalancePaise: 100000 },
  { id: "transfer-bank", type: "bank", openingBalancePaise: 0 },
];

const transferOnlyTransactions = [
  {
    type: "transfer",
    fromAccountId: "transfer-cash",
    toAccountId: "transfer-bank",
    amountPaise: 25000,
    occurredOn: "2026-09-21",
  },
];

assert.strictEqual(
  calculateAccountBalancePaise(
    transferOnlyAccounts[0],
    transferOnlyTransactions,
    today,
  ),
  75000,
);

assert.strictEqual(
  calculateAccountBalancePaise(
    transferOnlyAccounts[1],
    transferOnlyTransactions,
    today,
  ),
  25000,
);

assert.strictEqual(
  calculateNetWorthPaise(
    transferOnlyAccounts,
    transferOnlyTransactions,
    today,
  ),
  100000,
);


// Multiple transfers should calculate correctly.
const multipleTransferTransactions = [
  {
    type: "transfer",
    fromAccountId: "transfer-cash",
    toAccountId: "transfer-bank",
    amountPaise: 20000,
    occurredOn: "2026-09-20",
  },
  {
    type: "transfer",
    fromAccountId: "transfer-bank",
    toAccountId: "transfer-cash",
    amountPaise: 5000,
    occurredOn: "2026-09-21",
  },
];

assert.strictEqual(
  calculateAccountBalancePaise(
    transferOnlyAccounts[0],
    multipleTransferTransactions,
    today,
  ),
  85000,
);

assert.strictEqual(
  calculateAccountBalancePaise(
    transferOnlyAccounts[1],
    multipleTransferTransactions,
    today,
  ),
  15000,
);

assert.strictEqual(
  calculateNetWorthPaise(
    transferOnlyAccounts,
    multipleTransferTransactions,
    today,
  ),
  100000,
);


// Future transaction should not affect today's account balance.
const futureIncome = {
  type: "income",
  accountId: "cash",
  amountPaise: 99999,
  occurredOn: "2026-09-22",
};

assert.strictEqual(
  calculateAccountBalancePaise(cash, [futureIncome], today),
  10000,
);

assert.strictEqual(
  isTransactionInMonth(futureIncome, 2026, 8),
  true,
);


// Month boundary checks.
const augustTransaction = {
  type: "expense",
  accountId: "cash",
  amountPaise: 100,
  occurredOn: "2026-08-31",
};

const septemberTransaction = {
  type: "expense",
  accountId: "cash",
  amountPaise: 100,
  occurredOn: "2026-09-01",
};

assert.strictEqual(
  isTransactionInMonth(augustTransaction, 2026, 7),
  true,
);

assert.strictEqual(
  isTransactionInMonth(augustTransaction, 2026, 8),
  false,
);

assert.strictEqual(
  isTransactionInMonth(septemberTransaction, 2026, 8),
  true,
);

assert.strictEqual(
  isTransactionInMonth(septemberTransaction, 2026, 7),
  false,
);


// Zero amount should remain zero.
assert.strictEqual(
  getAmountPaise({ amountPaise: 0 }),
  0,
);

assert.strictEqual(
  getAmountPaise({ amount: 0 }),
  0,
);


// Archived accounts are currently still included in net worth.
// This test documents the current product behavior.
const archivedAccount = {
  id: "archived",
  type: "bank",
  openingBalancePaise: 50000,
  isArchived: true,
};

assert.strictEqual(
  calculateNetWorthPaise([archivedAccount], [], today),
  50000,
);

// ============================================================
// LEAN V2 MONTHLY MONEY PLAN CHECKS
// ============================================================

const leanV2Today = new Date(2026, 8, 25, 12);

// Multiple income sources should combine correctly.
const incomeSources = [
  {
    id: "salary",
    name: "Salary",
    amountPaise: 3000000,
  },
  {
    id: "freelance",
    name: "Freelance",
    amountPaise: 500000,
  },
];

const totalIncomePaise =
  calculatePlannedIncomePaise(incomeSources);

assert.strictEqual(
  totalIncomePaise,
  3500000,
);


// Fixed commitments from the real Lean V2 example.
const fixedCommitments = [
  {
    id: "rent",
    name: "Rent",
    amountPaise: 1400000,
  },
  {
    id: "emi",
    name: "EMI",
    amountPaise: 505200,
  },
  {
    id: "recharge",
    name: "Recharge",
    amountPaise: 117500,
  },
];

const totalFixedPaise =
  calculateFixedCommitmentsPaise(
    fixedCommitments,
  );

assert.strictEqual(
  totalFixedPaise,
  2022700,
);


// ₹35,000 - ₹20,227 = ₹14,773.
const moneyAfterFixedPaise =
  calculateMoneyAfterFixedPaise(
    totalIncomePaise,
    totalFixedPaise,
  );

assert.strictEqual(
  moneyAfterFixedPaise,
  1477300,
);


// Protect ₹4,000 as savings.
const savingsTargetPaise = 400000;

const plannedSpendablePaise =
  calculatePlannedSpendablePaise(
    moneyAfterFixedPaise,
    savingsTargetPaise,
  );

assert.strictEqual(
  plannedSpendablePaise,
  1077300,
);


// ₹4,000 is 11.43% of ₹35,000.
assert.strictEqual(
  calculateSavingsPercentage(
    totalIncomePaise,
    savingsTargetPaise,
  ),
  11.43,
);


// No income means savings percentage should be safe.
assert.strictEqual(
  calculateSavingsPercentage(
    0,
    400000,
  ),
  0,
);


// Actual variable spending.
//
// Food + travel should count.
//
// Rent is already reserved as a fixed commitment,
// so its actual payment must not reduce spendable
// money for a second time.
//
// Transfers are also not spending.
//
// Future expenses should not affect today's
// Safe-to-Spend calculation.
const leanV2Transactions = [
  {
    type: "expense",
    accountId: "bank",
    category: "Food & Dining",
    amountPaise: 200000,
    occurredOn: "2026-09-10",
  },
  {
    type: "expense",
    accountId: "bank",
    category: "Transportation",
    amountPaise: 85000,
    occurredOn: "2026-09-25",
  },
  {
    type: "expense",
    accountId: "bank",
    category: "Bills & Utilities",
    amountPaise: 1400000,
    fixedCommitmentId: "rent",
    occurredOn: "2026-09-05",
  },
  {
    type: "transfer",
    fromAccountId: "bank",
    toAccountId: "cash",
    amountPaise: 100000,
    occurredOn: "2026-09-15",
  },
  {
    type: "expense",
    accountId: "bank",
    category: "Shopping",
    amountPaise: 50000,
    occurredOn: "2026-09-26",
  },
  {
    type: "expense",
    accountId: "bank",
    category: "Food & Dining",
    amountPaise: 99999,
    occurredOn: "2026-10-01",
  },
];

const variableSpentPaise =
  calculateVariableSpentPaise(
    leanV2Transactions,
    2026,
    8,
    leanV2Today,
  );

assert.strictEqual(
  variableSpentPaise,
  285000,
);


// ₹10,773 - ₹2,850 = ₹7,923.
const remainingSpendablePaise =
  calculateRemainingSpendablePaise(
    plannedSpendablePaise,
    variableSpentPaise,
  );

assert.strictEqual(
  remainingSpendablePaise,
  792300,
);


// September 25 through September 30 = 6 days.
assert.strictEqual(
  getDaysRemainingInMonth(
    leanV2Today,
  ),
  6,
);


// ₹7,923 / 6 = ₹1,320.50 per day.
assert.strictEqual(
  calculateSafeToSpendPerDayPaise(
    remainingSpendablePaise,
    leanV2Today,
  ),
  132050,
);


// Last day of the month should still count as one day.
const lastDayOfSeptember =
  new Date(2026, 8, 30, 12);

assert.strictEqual(
  getDaysRemainingInMonth(
    lastDayOfSeptember,
  ),
  1,
);

assert.strictEqual(
  calculateSafeToSpendPerDayPaise(
    50000,
    lastDayOfSeptember,
  ),
  50000,
);


// Fixed commitments may exceed income.
// We preserve the negative financial position.
assert.strictEqual(
  calculateMoneyAfterFixedPaise(
    1000000,
    1200000,
  ),
  -200000,
);


// Savings may exceed money after fixed.
// Do not silently clamp the result.
assert.strictEqual(
  calculatePlannedSpendablePaise(
    500000,
    600000,
  ),
  -100000,
);


// Overspending must remain negative.
assert.strictEqual(
  calculateRemainingSpendablePaise(
    1000000,
    1150000,
  ),
  -150000,
);


// A negative Safe-to-Spend result should also
// remain visible rather than being changed to zero.
assert.strictEqual(
  calculateSafeToSpendPerDayPaise(
    -150000,
    new Date(2026, 8, 25, 12),
  ),
  -25000,
);


// Empty plans should be safe.
assert.strictEqual(
  calculatePlannedIncomePaise([]),
  0,
);

assert.strictEqual(
  calculateFixedCommitmentsPaise([]),
  0,
);

assert.strictEqual(
  parseMoneyInputToPaise("35000"),
  3500000,
);

assert.strictEqual(
  parseMoneyInputToPaise("10000.50"),
  1000050,
);

assert.strictEqual(
  parseMoneyInputToPaise("0"),
  0,
);

assert.strictEqual(
  parseMoneyInputToPaise("12.345"),
  null,
);

assert.strictEqual(
  parseMoneyInputToPaise(""),
  null,
);

console.log("Finance calculation checks passed.");
