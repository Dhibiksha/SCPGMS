import express from 'express';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/departmentController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDepartments);
router.post('/', authorizeRoles('ADMIN'), createDepartment);
router.put('/:id', authorizeRoles('ADMIN'), updateDepartment);

export default router;
