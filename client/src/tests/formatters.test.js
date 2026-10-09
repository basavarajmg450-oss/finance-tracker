import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters.js';

describe('Frontend Formatters', () => {
  it('should format currency with default USD symbol', () => {
    expect(formatCurrency(1250.5)).toBe('$1,250.50');
    expect(formatCurrency(-45.2)).toBe('-$45.20');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format currency with custom symbols', () => {
    expect(formatCurrency(2500, 'EUR')).toBe('€2,500.00');
    expect(formatCurrency(85000, 'INR')).toBe('?85,000.00');
    expect(formatCurrency(100, 'GBP')).toBe('£100.00');
  });

  it('should format percentage', () => {
    expect(formatPercentage(75.432)).toBe('75.4%');
    expect(formatPercentage(null)).toBe('N/A');
  });
});
