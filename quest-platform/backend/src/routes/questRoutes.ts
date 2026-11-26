import { Router } from 'express';
import {
  getQuests,
  getQuestById,
  createQuest,
  updateQuest,
  deleteQuest,
  getAdminQuests
} from '../controllers/questController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getQuests);
router.get('/:id', getQuestById);

// Admin routes
router.post('/', authenticateToken, requireAdmin, createQuest);
router.get('/admin/all', authenticateToken, requireAdmin, getAdminQuests);
router.put('/:id', authenticateToken, requireAdmin, updateQuest);
router.delete('/:id', authenticateToken, requireAdmin, deleteQuest);

export default router;