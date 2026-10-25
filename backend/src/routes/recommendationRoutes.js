import express from 'express';
import {
  getRecommendations,
  triggerGenerateRecommendations,
  acceptRecommendationHandler,
  rejectRecommendationHandler,
  getRecommendationOutcomeHandler,
  getFeedbackSummary
} from '../controllers/recommendationController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getRecommendations);
router.get('/feedback/summary', getFeedbackSummary);
router.post('/trigger', authorizeRoles('ADMIN', 'MANAGER'), triggerGenerateRecommendations);
router.post('/:id/accept', authorizeRoles('ADMIN', 'MANAGER'), acceptRecommendationHandler);
router.post('/:id/reject', authorizeRoles('ADMIN', 'MANAGER'), rejectRecommendationHandler);
router.get('/:id/outcome', getRecommendationOutcomeHandler);

export default router;
