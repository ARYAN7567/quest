import { Router } from 'express';
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestQuestions,
  bulkAddQuestions
} from '../controllers/questionController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
router.post('/', authenticateToken, requireAdmin, addQuestion);
router.get('/quest/:questId', authenticateToken, requireAdmin, getQuestQuestions);
router.post('/bulk', authenticateToken, requireAdmin, bulkAddQuestions);
router.put('/:id', authenticateToken, requireAdmin, updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, deleteQuestion);

export default router;