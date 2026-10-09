import express from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getContributions
} from '../controllers/goalController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createGoalSchema, updateGoalSchema, createContributionSchema } from '../validators/index.js';

const router = express.Router();

router.use(authenticate);
router.route('/')
  .get(getGoals)
  .post(validate(createGoalSchema), createGoal);

router.route('/:id')
  .patch(validate(updateGoalSchema), updateGoal)
  .delete(deleteGoal);

router.route('/:id/contributions')
  .get(getContributions)
  .post(validate(createContributionSchema), addContribution);

export default router;
