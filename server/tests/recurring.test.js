import './setup.js';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { Transaction } from '../src/models/Transaction.js';

describe('Recurring Transactions & Idempotency', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Diana Prince',
      email: 'diana@example.com',
      password: 'Password123!'
    });
    token = res.body.token;
  });

  it('should create recurring rule and process due transactions idempotently without duplicates', async () => {
    // 1. Create a monthly recurring subscription due today or earlier
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const createRes = await request(app)
      .post('/api/recurring-transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 15.99,
        category: 'Subscriptions',
        description: 'Cloud Storage Pro',
        frequency: 'monthly',
        startDate: pastDate,
        active: true
      });

    expect(createRes.status).toBe(201);
    const recurringId = createRes.body.data._id;

    // 2. Trigger first execution
    const run1 = await request(app)
      .post('/api/recurring-transactions/trigger-process')
      .set('Authorization', `Bearer ${token}`);

    expect(run1.status).toBe(200);
    expect(run1.body.data.processedCount).toBe(1);
    expect(run1.body.data.createdCount).toBe(1);

    // Verify 1 transaction was inserted into DB
    let txCount = await Transaction.countDocuments({ recurringTransactionId: recurringId });
    expect(txCount).toBe(1);

    // 3. Immediately trigger execution again -> IDEMPOTENCY CHECK
    // Should NOT create a second duplicate transaction for the same day
    const run2 = await request(app)
      .post('/api/recurring-transactions/trigger-process')
      .set('Authorization', `Bearer ${token}`);

    expect(run2.status).toBe(200);
    // Recurring rule nextRunDate was advanced by 1 month, so nextRunDate is in the future
    expect(run2.body.data.createdCount).toBe(0);

    txCount = await Transaction.countDocuments({ recurringTransactionId: recurringId });
    expect(txCount).toBe(1);
  });
});
