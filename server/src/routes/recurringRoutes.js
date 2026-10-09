import express from 'express';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  triggerProcess
} from '../controllers/recurringController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createRecurringSchema, updateRecurringSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);
router.route('/')
  .get(getRecurringTransactions)
  .post(validate(createRecurringSchema), createRecurringTransaction);

router.post('/trigger-process', triggerProcess);

router.route('/:id')
  .patch(validate(updateRecurringSchema), updateRecurringTransaction)
  .delete(deleteRecurringTransaction);

export default router;
