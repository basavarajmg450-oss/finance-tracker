import './setup.js';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { sanitizeCsvCell } from '../src/services/exportService.js';

describe('Analytics, Insights, and Export Sanitization', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password: 'Password123!'
    });
    token = res.body.token;
  });

  it('should handle zero-income edge case safely on dashboard without division by zero', async () => {
    // Add only an expense transaction (0 income)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 150,
        category: 'Food',
        description: 'Groceries'
      });

    const res = await request(app)
      .get('/api/dashboard/summary?period=this_month')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(0);
    expect(res.body.data.totalExpenses).toBe(150);
    expect(res.body.data.netCashFlow).toBe(-150);
    expect(res.body.data.savingsRate).toBeNull(); // Safe zero-income handling
  });

  it('should calculate accurate savings rate and trigger negative cashflow insight rule', async () => {
    // Add $1000 income and $1200 expenses -> Net -$200
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 1000,
        category: 'Salary',
        description: 'Stipend'
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 1200,
        category: 'Rent',
        description: 'Apartment rent'
      });

    const res = await request(app)
      .get('/api/dashboard/summary?period=this_month')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(1000);
    expect(res.body.data.totalExpenses).toBe(1200);
    expect(res.body.data.netCashFlow).toBe(-200);
    expect(res.body.data.savingsRate).toBe(-20); // ((1000 - 1200) / 1000) * 100

    // Insights check: should have deficit-warning and dominant-rent
    const insights = res.body.data.insights;
    expect(insights.some(i => i.id === 'deficit-warning')).toBe(true);
    expect(insights.some(i => i.id === 'dominant-rent')).toBe(true);
  });

  it('should sanitize CSV cells to prevent Formula Injection (=, +, -, @)', () => {
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
    expect(sanitizeCsvCell('+cmd|/C calc')).toBe('"\' +cmd|/C calc"'.replace(' ', ''));
    expect(sanitizeCsvCell('-100')).toBe('"\' -100"'.replace(' ', ''));
    expect(sanitizeCsvCell('@alert("xss")')).toBe('"\'@alert(""xss"")"');
    expect(sanitizeCsvCell('Normal Text')).toBe('"Normal Text"');
    expect(sanitizeCsvCell('Text with "quotes"')).toBe('"Text with ""quotes"""');
  });

  it('should export sanitized CSV file through API', async () => {
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 2500,
        category: 'Salary',
        description: '=1+1 dangerous formula'
      });

    const res = await request(app)
      .get('/api/reports/export/csv')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('"\'=1+1 dangerous formula"');
  });
});
