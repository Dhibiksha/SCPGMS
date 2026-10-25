import express from 'express';
import { getSkills, createSkill, assignEmployeeSkill } from '../controllers/skillController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSkills);
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createSkill);
router.post('/employee/:id', authorizeRoles('ADMIN', 'MANAGER'), assignEmployeeSkill);

export default router;
