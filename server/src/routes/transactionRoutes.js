import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);
router.route('/')
  .get(getTransactions)
  .post(validate(createTransactionSchema), createTransaction);

router.route('/:id')
  .get(getTransactionById)
  .patch(validate(updateTransactionSchema), updateTransaction)
  .delete(deleteTransaction);

export default router;
