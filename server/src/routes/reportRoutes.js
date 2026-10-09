import express from 'express';
import { getReportSummary, exportCsv } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/summary', getReportSummary);
router.get('/export/csv', exportCsv);

export default router;
