import { Router } from 'express';
import {
  submitAnswers,
  getQuestAverages,
  getUserSubmission
} from '../controllers/submissionController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, submitAnswers);
router.get('/averages/:questId', optionalAuth, getQuestAverages);
router.get('/my/:questId', authenticateToken, getUserSubmission);

export default router;