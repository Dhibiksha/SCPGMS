import express from 'express';
import { getTeamWorkload, getGoalRisk, getRiskDashboard } from '../controllers/intelligenceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/workload/team', getTeamWorkload);
router.get('/workload/team/:deptId', getTeamWorkload);
router.get('/risk/goal/:goalId', getGoalRisk);
router.get('/risk/dashboard', getRiskDashboard);

export default router;
