import { CURRENCY_SYMBOLS } from './constants.js';

export const formatCurrency = (amount, currencyCode = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY_SYMBOLS[currencyCode] || '$'}0.00`;
  }
  const symbol = CURRENCY_SYMBOLS[currencyCode] || '$';
  const formatted = Math.abs(Number(amount)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
};

export const formatDate = (dateString, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', options);
};

export const formatPercentage = (val) => {
  if (val === null || val === undefined) return 'N/A';
  return `${Number(val).toFixed(1)}%`;
};
