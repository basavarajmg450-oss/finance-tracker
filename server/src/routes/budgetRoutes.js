import express from 'express';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../controllers/budgetController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);
router.route('/')
  .get(getBudgets)
  .post(validate(createBudgetSchema), createBudget);

router.route('/:id')
  .patch(validate(updateBudgetSchema), updateBudget)
  .delete(deleteBudget);

export default router;
