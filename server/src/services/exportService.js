/**
 * Escapes a cell value conforming to RFC 4180 and protects against CSV Formula Injection.
 */
export const sanitizeCsvCell = (value) => {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // CSV Injection Neutralization:
  // If the cell begins with =, +, -, @, or \t, \r, prepend a single quote so Excel/Sheets treats it as text.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them
  str = str.replace(/"/g, '""');

  return `"${str}"`;
};

export const generateTransactionsCsv = (transactions, currency = 'USD') => {
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Category',
    'Description',
    'Amount',
    'Currency',
    'Payment Method',
    'Notes',
    'Recurring'
  ];

  const rows = transactions.map(t => {
    const dateFormatted = t.transactionDate
      ? new Date(t.transactionDate).toISOString().split('T')[0]
      : '';

    return [
      sanitizeCsvCell(t._id),
      sanitizeCsvCell(dateFormatted),
      sanitizeCsvCell(t.type ? t.type.toUpperCase() : ''),
      sanitizeCsvCell(t.category),
      sanitizeCsvCell(t.description),
      sanitizeCsvCell(Number(t.amount).toFixed(2)),
      sanitizeCsvCell(currency),
      sanitizeCsvCell(t.paymentMethod || 'Cash'),
      sanitizeCsvCell(t.notes || ''),
      sanitizeCsvCell(t.recurringTransactionId ? 'Yes' : 'No')
    ].join(',');
  });

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
};
