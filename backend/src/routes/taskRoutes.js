import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  addDependency,
  getDownstreamImpactHandler
} from '../controllers/taskController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createTask);
router.put('/:id', updateTask); // Employees can update status/progress of their tasks
router.post('/:id/dependencies', authorizeRoles('ADMIN', 'MANAGER'), addDependency);
router.get('/:id/downstream-impact', getDownstreamImpactHandler);

export default router;
