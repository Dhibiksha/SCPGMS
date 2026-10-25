import express from 'express';
import { getProductivityReport, getWorkloadReport, getRiskReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/productivity', getProductivityReport);
router.get('/workload', getWorkloadReport);
router.get('/risk', getRiskReport);

export default router;
