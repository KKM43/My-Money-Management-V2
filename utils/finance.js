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

module.exports = {
  calculateAccountBalancePaise,
  calculateNetWorthPaise,
  getAccountDisplayAmountPaise,
  getAmountPaise,
  getTransactionBalanceEffectPaise,
  getTransactionDateKey,
  isTransactionInMonth,
  isTransactionOnOrBeforeToday,
};
