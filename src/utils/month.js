const getMonthKeyFromDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const getCurrentMonthKey = () => getMonthKeyFromDate(new Date());

const shiftMonthKey = (monthKey, offset) => {
  const [year, month] = monthKey.split("-").map(Number);

  const shiftedDate = new Date(year, month - 1 + offset, 1);

  return getMonthKeyFromDate(shiftedDate);
};

const getPreviousMonthKey = (monthKey) => shiftMonthKey(monthKey, -1);

const formatMonthKey = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

module.exports = {
  formatMonthKey,
  getCurrentMonthKey,
  getMonthKeyFromDate,
  getPreviousMonthKey,
  shiftMonthKey,
};