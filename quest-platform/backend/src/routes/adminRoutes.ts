import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getQuestSubmissions
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
router.get('/stats', authenticateToken, requireAdmin, getDashboardStats);
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.get('/submissions/:questId', authenticateToken, requireAdmin, getQuestSubmissions);

export default router;