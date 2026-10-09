import './setup.js';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Transaction Endpoints & Isolation', () => {
  let user1Token;
  let user2Token;

  beforeEach(async () => {
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'Password123!'
    });
    user1Token = res1.body.token;

    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'Password123!'
    });
    user2Token = res2.body.token;
  });

  it('should create an income and an expense transaction', async () => {
    const incomeRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        type: 'income',
        amount: 3500,
        category: 'Salary',
        description: 'Monthly Software Engineer Salary',
        paymentMethod: 'Bank Transfer'
      });

    expect(incomeRes.status).toBe(201);
    expect(incomeRes.body.data.amount).toBe(3500);
    expect(incomeRes.body.data.category).toBe('Salary');

    const expenseRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        type: 'expense',
        amount: 120,
        category: 'Food',
        description: 'Grocery shopping',
        paymentMethod: 'Credit Card'
      });

    expect(expenseRes.status).toBe(201);
    expect(expenseRes.body.data.amount).toBe(120);
    expect(expenseRes.body.data.category).toBe('Food');
  });

  it('should enforce strict user isolation: User 2 cannot access or modify User 1 transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        type: 'expense',
        amount: 50,
        category: 'Transportation',
        description: 'Bus pass'
      });

    const txId = createRes.body.data._id;

    // User 2 attempts to get User 1's transaction
    const getRes = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(getRes.status).toBe(404);

    // User 2 attempts to update User 1's transaction
    const updateRes = await request(app)
      .patch(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ amount: 999 });
    expect(updateRes.status).toBe(404);

    // User 2 attempts to delete User 1's transaction
    const deleteRes = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(deleteRes.status).toBe(404);

    // Verify User 1's transaction remains unchanged
    const verifyRes = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.amount).toBe(50);
  });

  it('should filter, search, and paginate transactions', async () => {
    // Add multiple transactions
    const entries = [
      { type: 'income', amount: 2000, category: 'Freelancing', description: 'Web design client project' },
      { type: 'expense', amount: 45, category: 'Food', description: 'Restaurant lunch' },
      { type: 'expense', amount: 80, category: 'Shopping', description: 'Books and stationery' },
      { type: 'expense', amount: 30, category: 'Food', description: 'Coffee shop' }
    ];

    for (const entry of entries) {
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(entry);
    }

    // Filter by category 'Food'
    const filterRes = await request(app)
      .get('/api/transactions?category=Food')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.length).toBe(2);

    // Search by keyword 'lunch'
    const searchRes = await request(app)
      .get('/api/transactions?search=lunch')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].description).toBe('Restaurant lunch');

    // Pagination test (limit=2)
    const pageRes = await request(app)
      .get('/api/transactions?limit=2&page=1')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(pageRes.status).toBe(200);
    expect(pageRes.body.data.length).toBe(2);
    expect(pageRes.body.pagination.total).toBe(4);
    expect(pageRes.body.pagination.totalPages).toBe(2);
  });
});
