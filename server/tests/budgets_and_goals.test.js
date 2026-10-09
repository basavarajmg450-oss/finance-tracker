import './setup.js';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Budgets and Goals', () => {
  let token;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'Password123!'
    });
    token = res.body.token;
  });

  it('should create a category budget and calculate spent and 80%/100% alerts dynamically', async () => {
    // 1. Create a budget for Food: $300
    const budgetRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Food',
        amount: 300,
        month: currentMonth,
        year: currentYear
      });

    expect(budgetRes.status).toBe(201);

    // 2. Add expense of $250 (83.3% -> should trigger near limit alert)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 250,
        category: 'Food',
        description: 'Supermarket supplies',
        transactionDate: new Date()
      });

    const listRes = await request(app)
      .get(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    const foodBudget = listRes.body.data.find(b => b.category === 'Food');
    expect(foodBudget).toBeDefined();
    expect(foodBudget.spent).toBe(250);
    expect(foodBudget.remaining).toBe(50);
    expect(foodBudget.percentage).toBe(83.3);
    expect(foodBudget.isNearLimit).toBe(true);
    expect(foodBudget.isExceeded).toBe(false);

    // 3. Add additional expense of $60 -> Total $310 (> 100% -> exceeded)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 60,
        category: 'Food',
        description: 'Dinner delivery',
        transactionDate: new Date()
      });

    const listResExceeded = await request(app)
      .get(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`);

    const updatedFoodBudget = listResExceeded.body.data.find(b => b.category === 'Food');
    expect(updatedFoodBudget.spent).toBe(310);
    expect(updatedFoodBudget.percentage).toBe(103.3);
    expect(updatedFoodBudget.isExceeded).toBe(true);
  });

  it('should enforce compound uniqueness for budget on user, category, month, and year', async () => {
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Shopping',
        amount: 200,
        month: currentMonth,
        year: currentYear
      });

    const duplicateRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Shopping',
        amount: 300,
        month: currentMonth,
        year: currentYear
      });

    expect(duplicateRes.status).toBe(409);
  });

  it('should create savings goal and record atomic contributions via $inc', async () => {
    // 1. Create a financial goal
    const goalRes = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Emergency Fund',
        targetAmount: 1000,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

    expect(goalRes.status).toBe(201);
    const goalId = goalRes.body.data._id;
    expect(goalRes.body.data.currentAmount).toBe(0);

    // 2. Add contribution of $400
    const contrib1 = await request(app)
      .post(`/api/goals/${goalId}/contributions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 400,
        notes: 'Monthly savings transfer'
      });

    expect(contrib1.status).toBe(201);
    expect(contrib1.body.data.goal.currentAmount).toBe(400);

    // 3. Add second contribution of $600 -> reaches $1000 -> status should transition to completed
    const contrib2 = await request(app)
      .post(`/api/goals/${goalId}/contributions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 600,
        notes: 'Final savings lump sum'
      });

    expect(contrib2.status).toBe(201);
    expect(contrib2.body.data.goal.currentAmount).toBe(1000);
    expect(contrib2.body.data.goal.status).toBe('completed');
  });
});
