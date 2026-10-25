import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getEmployeeWorkload,
  getEmployeeProductivity
} from '../controllers/employeeController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getEmployees);
router.post('/', authorizeRoles('ADMIN'), createEmployee);
router.get('/:id', getEmployeeById);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateEmployee);
router.get('/:id/workload', getEmployeeWorkload);
router.get('/:id/productivity', getEmployeeProductivity);

export default router;
