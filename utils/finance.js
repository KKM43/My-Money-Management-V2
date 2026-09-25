const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const getAmountPaise = (transaction) => {
  if (!transaction) return 0;

  return Number.isInteger(transaction.amountPaise)
    ? transaction.amountPaise
    : Math.round(Number(transaction.amount || 0) * 100);
};

const getTransactionDateKey = (transaction) => {
  const dateValue = transaction?.occurredOn || transaction?.date;
  if (!dateValue) return null;

  if (transaction.occurredOn && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  return toLocalDateKey(new Date(dateValue));
};

const isTransactionOnOrBeforeToday = (transaction, now = new Date()) => {
  const transactionDateKey = getTransactionDateKey(transaction);
  const todayKey = toLocalDateKey(now);

  return Boolean(transactionDateKey && todayKey && transactionDateKey <= todayKey);
};

const isTransactionInMonth = (transaction, year, month) => {
  const dateKey = getTransactionDateKey(transaction);
  if (!dateKey) return false;

  return (
    dateKey.startsWith(
      `${year}-${String(month + 1).padStart(2, "0")}`,
    )
  );
};

const getTransactionBalanceEffectPaise = (transaction, accountId) => {
  const amountPaise = getAmountPaise(transaction);

  if (transaction?.type === "transfer") {
    if (transaction.fromAccountId === accountId) return -amountPaise;
    if (transaction.toAccountId === accountId) return amountPaise;
    return 0;
  }

  if (transaction?.accountId !== accountId) return 0;

  return transaction.type === "income" ? amountPaise : -amountPaise;
};

const calculateAccountBalancePaise = (
  account,
  transactions,
  now = new Date(),
) => {
  const openingBalancePaise = Number(account?.openingBalancePaise || 0);

  return (
    openingBalancePaise +
    transactions.reduce((balance, transaction) => {
      if (!isTransactionOnOrBeforeToday(transaction, now)) return balance;

      return balance + getTransactionBalanceEffectPaise(transaction, account.id);
    }, 0)
  );
};

const calculateNetWorthPaise = (accounts, transactions, now = new Date()) =>
  accounts.reduce(
    (total, account) =>
      total + calculateAccountBalancePaise(account, transactions, now),
    0,
  );

const getAccountDisplayAmountPaise = (account, signedBalancePaise) => {
  if (account?.type === "creditCard") {
    return Math.max(-signedBalancePaise, 0);
  }

  return signedBalancePaise;
};

const calculatePlannedIncomePaise = (incomeSources = []) =>
  incomeSources.reduce(
    (total, incomeSource) =>
      total + getAmountPaise(incomeSource),
    0,
  );

const calculateFixedCommitmentsPaise = (
  fixedCommitments = [],
) =>
  fixedCommitments.reduce(
    (total, commitment) =>
      total + getAmountPaise(commitment),
    0,
  );

const calculateMoneyAfterFixedPaise = (
  totalIncomePaise,
  totalFixedPaise,
) =>
  Number(totalIncomePaise || 0) -
  Number(totalFixedPaise || 0);

const calculatePlannedSpendablePaise = (
  moneyAfterFixedPaise,
  savingsTargetPaise,
) =>
  Number(moneyAfterFixedPaise || 0) -
  Number(savingsTargetPaise || 0);

const calculateSavingsPercentage = (
  totalIncomePaise,
  savingsTargetPaise,
) => {
  if (totalIncomePaise <= 0) {
    return 0;
  }

  return (
    Math.round(
      (savingsTargetPaise / totalIncomePaise) *
        100 *
        100,
    ) / 100
  );
};

const calculateVariableSpentPaise = (
  transactions = [],
  year,
  month,
  now = new Date(),
) =>
  transactions.reduce((total, transaction) => {
    if (transaction?.type !== "expense") {
      return total;
    }

    if (transaction.fixedCommitmentId) {
      return total;
    }

    if (
      !isTransactionInMonth(
        transaction,
        year,
        month,
      )
    ) {
      return total;
    }

    if (
      !isTransactionOnOrBeforeToday(
        transaction,
        now,
      )
    ) {
      return total;
    }

    return total + getAmountPaise(transaction);
  }, 0);

const calculateRemainingSpendablePaise = (
  plannedSpendablePaise,
  variableSpentPaise,
) =>
  Number(plannedSpendablePaise || 0) -
  Number(variableSpentPaise || 0);

const getDaysRemainingInMonth = (
  now = new Date(),
) => {
  if (
    !(now instanceof Date) ||
    Number.isNaN(now.getTime())
  ) {
    return 0;
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  return daysInMonth - currentDay + 1;
};

const calculateSafeToSpendPerDayPaise = (
  remainingSpendablePaise,
  now = new Date(),
) => {
  const daysRemaining =
    getDaysRemainingInMonth(now);

  if (daysRemaining <= 0) {
    return 0;
  }

  return Math.trunc(
    Number(remainingSpendablePaise || 0) /
      daysRemaining,
  );
};


const parseMoneyInputToPaise = (value) => {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [rupees, paise = ""] = trimmed.split(".");

  return (
    Number(rupees) * 100 +
    Number(paise.padEnd(2, "0"))
  );
};

module.exports = {
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
  getTransactionBalanceEffectPaise,
  getTransactionDateKey,
  isTransactionInMonth,
  isTransactionOnOrBeforeToday,
  parseMoneyInputToPaise,
};
