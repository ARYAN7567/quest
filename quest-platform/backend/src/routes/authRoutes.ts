import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateAuth } from '../middleware/validation';

const router = Router();

/**
 * Registration endpoint
 * Validates input and checks password complexity
 * Rate limited by authRateLimit in index.ts
 */
router.post('/register', validateAuth, register);

/**
 * Login endpoint
 * Validates input format
 * Rate limited by authRateLimit in index.ts
 */
router.post('/login', validateAuth, login);

/**
 * Profile endpoint
 * Requires valid JWT token
 */
router.get('/profile', authenticateToken, getProfile);

export default router;