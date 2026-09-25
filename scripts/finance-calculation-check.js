const assert = require("assert");
const {
  calculateAccountBalancePaise,
  calculateNetWorthPaise,
  getAccountDisplayAmountPaise,
  getAmountPaise,
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

console.log("Finance calculation checks passed.");
