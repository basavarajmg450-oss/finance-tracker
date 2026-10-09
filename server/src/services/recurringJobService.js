import { RecurringTransaction } from '../models/RecurringTransaction.js';
import { Transaction } from '../models/Transaction.js';

export const calculateNextRunDate = (currentDate, frequency) => {
  const d = new Date(currentDate);
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d;
};

export const processRecurringTransactions = async (userId = null) => {
  const now = new Date();
  const query = {
    active: true,
    nextRunDate: { $lte: now }
  };
  if (userId) {
    query.userId = userId;
  }

  const dueItems = await RecurringTransaction.find(query);
  const createdTransactions = [];

  for (const item of dueItems) {
    // Check if duplicate already created today for this recurring transaction
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const existing = await Transaction.findOne({
      recurringTransactionId: item._id,
      transactionDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!existing) {
      const transaction = await Transaction.create({
        userId: item.userId,
        type: item.type,
        amount: item.amount,
        category: item.category,
        description: `[Recurring] ${item.description}`,
        transactionDate: new Date(),
        paymentMethod: 'Bank Transfer',
        notes: `Generated automatically from ${item.frequency} recurring rule`,
        recurringTransactionId: item._id
      });
      createdTransactions.push(transaction);
    }

    // Advance nextRunDate
    const nextDate = calculateNextRunDate(item.nextRunDate, item.frequency);
    item.lastProcessedDate = now;
    item.nextRunDate = nextDate;

    if (item.endDate && nextDate > new Date(item.endDate)) {
      item.active = false;
    }

    await item.save();
  }

  return {
    processedCount: dueItems.length,
    createdCount: createdTransactions.length,
    transactions: createdTransactions
  };
};
