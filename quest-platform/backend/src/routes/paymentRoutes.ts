import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/order', authenticateToken, createOrder);
router.post('/verify', authenticateToken, verifyPayment);
router.get('/history', authenticateToken, getPaymentHistory);

export default router;