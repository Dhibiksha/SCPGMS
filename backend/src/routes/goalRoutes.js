import express from 'express';
import {
  getGoals,
  getGoalHierarchy,
  createGoal,
  updateGoal,
  getMilestonesByGoal,
  createMilestone
} from '../controllers/goalController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getGoals);
router.get('/hierarchy', getGoalHierarchy);
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createGoal);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateGoal);

router.get('/:id/milestones', getMilestonesByGoal);
router.post('/:id/milestones', authorizeRoles('ADMIN', 'MANAGER'), createMilestone);

export default router;
