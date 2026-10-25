import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('ADMIN'), getAuditLogs);

export default router;
