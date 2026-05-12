import express from 'express';
import {
  googleCallback,
  googleFailure,
  googleStart,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, me);
router.get('/google', googleStart);
router.get('/google/callback', googleCallback);
router.get('/google/failure', googleFailure);

export default router;
