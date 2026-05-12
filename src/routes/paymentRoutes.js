import express from 'express';
import { checkoutSession, checkoutSuccess } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/checkout-session', protect, checkoutSession);
router.get('/checkout-session/:sessionId/success', protect, checkoutSuccess);

export default router;
