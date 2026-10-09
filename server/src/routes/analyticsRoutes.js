import express from 'express';
import { getOverview, getCategoryBreakdown, getMonthlyTrends } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/overview', getOverview);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-trends', getMonthlyTrends);

export default router;
