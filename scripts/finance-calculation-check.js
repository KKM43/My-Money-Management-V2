const assert = require("assert");
const {
  calculateAccountBalancePaise,
  calculateNetWorthPaise,
  getAccountDisplayAmountPaise,
  getAmountPaise,
  isTransactionInMonth,
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

console.log("Finance calculation checks passed.");
